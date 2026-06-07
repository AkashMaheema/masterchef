import { prisma } from "@/lib/prisma"

type SubstitutionRequest = {
  ingredientName?: string
  goals?: string[]
  notes?: string
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
    const body = (await req.json()) as SubstitutionRequest
    const ingredientName = body.ingredientName?.trim()
    const goals = Array.isArray(body.goals) ? body.goals.filter(Boolean).slice(0, 6) : []
    const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 400) : ""

    if (!ingredientName) {
      return Response.json({ error: "Choose an ingredient to substitute." }, { status: 400 })
    }

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

    const ingredient = recipe.ingredients.find(
      (item) => item.name.toLowerCase() === ingredientName.toLowerCase()
    )

    if (!ingredient) {
      return Response.json({ error: "Ingredient not found in this recipe." }, { status: 404 })
    }

    const prompt = [
      "Suggest ingredient substitutions for a recipe.",
      "Return only valid JSON with a key substitutions. substitutions must be an array of 4 objects.",
      "Each object must include name, amount, bestFor, caveat, and confidence.",
      "confidence must be High, Medium, or Low.",
      "Keep suggestions practical, food-safe, and specific to the original recipe.",
      "",
      `Recipe: ${recipe.title}`,
      `Ingredient to replace: ${ingredient.amount} ${ingredient.unit} ${ingredient.name}`,
      `User goals: ${goals.join(", ") || "General substitution"}`,
      `User notes: ${notes || "None"}`,
      `All ingredients: ${recipe.ingredients
        .map((item) => `${item.amount} ${item.unit} ${item.name}`)
        .join(", ")}`,
      `Recipe steps: ${recipe.steps.map((step) => `${step.order}. ${step.description}`).join(" ")}`,
    ].join("\n")

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.65,
            maxOutputTokens: 1000,
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
        { error: "Gemini returned no substitutions." },
        { status: 502 }
      )
    }

    return Response.json({
      ingredient: `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`,
      substitutions: safeParseJson(text).substitutions || [],
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Substitution request failed." },
      { status: 500 }
    )
  }
}
