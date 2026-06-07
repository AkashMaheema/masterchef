import { prisma } from "@/lib/prisma"

type RemixRequest = {
  goals?: string[]
  customRequest?: string
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

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return Response.json(
      { error: "Gemini API key is not configured." },
      { status: 500 }
    )
  }

  try {
    const { id } = await ctx.params
    const body = (await req.json()) as RemixRequest
    const goals = Array.isArray(body.goals) ? body.goals.filter(Boolean).slice(0, 8) : []
    const customRequest = typeof body.customRequest === "string" ? body.customRequest.trim() : ""

    if (!goals.length && !customRequest) {
      return Response.json(
        { error: "Choose at least one remix goal or enter a custom request." },
        { status: 400 }
      )
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        category: true,
        ingredients: true,
        steps: { orderBy: { order: "asc" } },
      },
    })

    if (!recipe) {
      return Response.json({ error: "Recipe not found." }, { status: 404 })
    }

    const prompt = [
      "Remix this saved recipe for a cooking app user.",
      "Return only valid JSON with these keys: title, summary, changes, ingredients, steps, tips.",
      "changes, ingredients, steps, and tips must be arrays of strings.",
      "Keep the recipe practical and safe. Do not claim the remix was saved.",
      "",
      `Remix goals: ${goals.join(", ") || "Custom request only"}`,
      `Custom request: ${customRequest || "None"}`,
      "",
      "Original recipe:",
      `Title: ${recipe.title}`,
      `Category: ${recipe.category?.name || "Uncategorized"}`,
      `Difficulty: ${recipe.difficulty}`,
      `Time: ${recipe.timeToCook} minutes`,
      `Servings: ${recipe.servings}`,
      `Description: ${recipe.description}`,
      `Ingredients: ${recipe.ingredients
        .map((ingredient) => `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`)
        .join(", ")}`,
      `Steps: ${recipe.steps
        .map((step) => `${step.order}. ${step.description}`)
        .join(" ")}`,
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
            maxOutputTokens: 1200,
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
      return Response.json(
        { error: "Gemini returned an empty remix." },
        { status: 502 }
      )
    }

    return Response.json({ remix: safeParseJson(text) })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Recipe remix failed." },
      { status: 500 }
    )
  }
}
