import { prisma } from "@/lib/prisma"

const GEMINI_MODEL = "gemini-2.0-flash"

function extractGeminiText(data: {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}) {
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || ""
}

function safeParseJson(text: string) {
  return JSON.parse(
    text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim()
  )
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return Response.json({ error: "Gemini API key is not configured." }, { status: 500 })
  }

  try {
    const { id } = await ctx.params
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: true,
        steps: { orderBy: { order: "asc" } },
      },
    })

    if (!recipe) {
      return Response.json({ error: "Recipe not found." }, { status: 404 })
    }

    const prompt = [
      "Score this recipe for a consumer recipe app.",
      "Return only valid JSON with keys badges, healthScore, budgetScore, timeScore, summary, improvements.",
      "badges and improvements must be arrays of strings.",
      "Scores must be numbers from 1 to 10.",
      "Be practical, not medical. Do not claim exact calories or clinical nutrition.",
      "",
      `Recipe: ${recipe.title}`,
      `Servings: ${recipe.servings}`,
      `Time: ${recipe.timeToCook} minutes`,
      `Difficulty: ${recipe.difficulty}`,
      `Ingredients: ${recipe.ingredients.map((item) => `${item.amount} ${item.unit} ${item.name}`).join(", ")}`,
      `Steps: ${recipe.steps.map((step) => `${step.order}. ${step.description}`).join(" ")}`,
    ].join("\n")

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1000,
            responseMimeType: "application/json",
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return Response.json({ error: errorText || "Gemini request failed." }, { status: response.status })
    }

    const text = extractGeminiText(await response.json())
    if (!text) {
      return Response.json({ error: "Gemini returned no score." }, { status: 502 })
    }

    return Response.json({ score: safeParseJson(text) })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Recipe scoring failed." },
      { status: 500 }
    )
  }
}
