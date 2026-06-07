import { prisma } from "@/lib/prisma"

type FridgeRequest = {
  ingredients?: string[]
  notes?: string
}

const GEMINI_MODEL = "gemini-2.0-flash"

function normalizeIngredient(value: string) {
  return value.trim().toLowerCase()
}

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
    const body = (await req.json()) as FridgeRequest
    const ingredients = Array.isArray(body.ingredients)
      ? Array.from(new Set(body.ingredients.map(normalizeIngredient).filter(Boolean))).slice(0, 30)
      : []
    const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : ""

    if (!ingredients.length) {
      return Response.json(
        { error: "Add at least one ingredient from your fridge." },
        { status: 400 }
      )
    }

    const recipes = await prisma.recipe.findMany({
      take: 60,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        ingredients: true,
      },
    })

    const matches = recipes
      .map((recipe) => {
        const recipeIngredients = recipe.ingredients.map((ingredient) =>
          normalizeIngredient(ingredient.name)
        )
        const matchedIngredients = ingredients.filter((ingredient) =>
          recipeIngredients.some(
            (recipeIngredient) =>
              recipeIngredient.includes(ingredient) || ingredient.includes(recipeIngredient)
          )
        )
        const score = recipeIngredients.length
          ? matchedIngredients.length / recipeIngredients.length
          : 0

        return {
          id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          url: `/recipes/${recipe.id}`,
          timeToCook: recipe.timeToCook,
          difficulty: recipe.difficulty,
          category: recipe.category?.name || "Uncategorized",
          matchedIngredients,
          missingCount: Math.max(recipeIngredients.length - matchedIngredients.length, 0),
          score,
        }
      })
      .filter((recipe) => recipe.matchedIngredients.length > 0)
      .sort((a, b) => b.score - a.score || a.missingCount - b.missingCount)
      .slice(0, 6)

    const prompt = [
      "A user wants meal ideas from ingredients they already have.",
      "Return only valid JSON with a key ideas. ideas must be an array of 3 objects.",
      "Each idea object must include title, summary, useThese, addThese, steps, and tip.",
      "useThese, addThese, and steps must be arrays of strings.",
      "Keep ideas practical for a home cook and use the user's ingredients heavily.",
      "",
      `Available ingredients: ${ingredients.join(", ")}`,
      `User notes: ${notes || "None"}`,
      "",
      "Saved recipe matches from the app:",
      matches
        .map(
          (match) =>
            `${match.title} (${match.url}) uses ${match.matchedIngredients.join(", ")}`
        )
        .join("\n") || "No saved recipes matched.",
    ].join("\n")

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1400,
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
        { error: "Gemini returned no fridge ideas." },
        { status: 502 }
      )
    }

    return Response.json({
      matches,
      ideas: safeParseJson(text).ideas || [],
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Fridge recipe search failed." },
      { status: 500 }
    )
  }
}
