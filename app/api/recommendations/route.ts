import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
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

export async function POST() {
  const session = await getServerSession(authOptions)
  const apiKey = process.env.GEMINI_API_KEY

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!apiKey) {
    return Response.json({ error: "Gemini API key is not configured." }, { status: 500 })
  }

  try {
    const profile = await prisma.tasteProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      return Response.json(
        { error: "Create your taste profile before getting recommendations." },
        { status: 400 }
      )
    }

    const recipes = await prisma.recipe.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        ingredients: true,
      },
    })

    const prompt = [
      "Recommend recipes from this app for a user.",
      "Return only valid JSON with keys summary and recommendations.",
      "recommendations must be an array of 6 objects with title, url, reason, matchTags, and tweak.",
      "Only recommend saved recipes from the provided list. Use the exact URL.",
      "",
      `Taste profile cuisines: ${profile.cuisines.join(", ") || "Any"}`,
      `Diet goals: ${profile.diets.join(", ") || "None"}`,
      `Spice level 1-5: ${profile.spiceLevel}`,
      `Budget: ${profile.budget}`,
      `Notes: ${profile.notes || "None"}`,
      "",
      "Saved recipes:",
      recipes
        .map(
          (recipe) =>
            `${recipe.title} | /recipes/${recipe.id} | ${recipe.category?.name || "Uncategorized"} | ${recipe.difficulty} | ${recipe.timeToCook} min | ${recipe.description} | Ingredients: ${recipe.ingredients.map((item) => item.name).join(", ")}`
        )
        .join("\n") || "No saved recipes.",
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
            maxOutputTokens: 1500,
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
      return Response.json({ error: "Gemini returned no recommendations." }, { status: 502 })
    }

    return Response.json({ result: safeParseJson(text) })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Recommendations failed." },
      { status: 500 }
    )
  }
}
