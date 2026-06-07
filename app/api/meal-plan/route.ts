import { prisma } from "@/lib/prisma"

type MealPlanRequest = {
  days?: number
  preferences?: string
}

const GEMINI_MODEL = "gemini-2.0-flash"

function extractGeminiText(data: {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}) {
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("") || ""
  )
}

function safeParseJson(text: string) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim()

  return JSON.parse(cleaned)
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return Response.json(
      { error: "Gemini API key is not configured." },
      { status: 500 }
    )
  }

  try {
    const body = (await req.json()) as MealPlanRequest
    const days = Math.max(1, Math.min(7, Number(body.days || 7)))
    const preferences = typeof body.preferences === "string" ? body.preferences.trim().slice(0, 800) : ""

    const recipes = await prisma.recipe.findMany({
      take: 40,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        ingredients: true,
      },
    })

    const recipeContext = recipes
      .map((recipe) =>
        [
          `${recipe.title} (/recipes/${recipe.id})`,
          `Category: ${recipe.category?.name || "Uncategorized"}`,
          `Time: ${recipe.timeToCook} minutes`,
          `Servings: ${recipe.servings}`,
          `Difficulty: ${recipe.difficulty}`,
          `Ingredients: ${recipe.ingredients.map((ingredient) => ingredient.name).join(", ")}`,
        ].join(" | ")
      )
      .join("\n")

    const prompt = [
      "Create a practical meal plan for a recipe app user.",
      "Return only valid JSON with keys summary, prepPlan, days.",
      "days must be an array. Each day object must include day, breakfast, lunch, dinner, and note.",
      "Each meal must include title, source, url, and reason.",
      "Use saved recipes when relevant. For new AI ideas, set source to AI idea and url to empty string.",
      "prepPlan must be an array of strings.",
      "",
      `Number of days: ${days}`,
      `User preferences: ${preferences || "Balanced home-cooked meals with reasonable prep time"}`,
      "",
      "Saved recipes:",
      recipeContext || "No saved recipes yet.",
    ].join("\n")

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 2200,
            responseMimeType: "application/json",
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return Response.json(
        { error: errorText || "Gemini request failed." },
        { status: response.status }
      )
    }

    const data = await response.json()
    const text = extractGeminiText(data)

    if (!text) {
      return Response.json({ error: "Gemini returned no meal plan." }, { status: 502 })
    }

    return Response.json({ plan: safeParseJson(text) })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Meal planning failed." },
      { status: 500 }
    )
  }
}
