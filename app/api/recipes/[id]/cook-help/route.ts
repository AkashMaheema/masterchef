import { prisma } from "@/lib/prisma"

type CookHelpRequest = {
  question?: string
  stepIndex?: number
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
    const body = (await req.json()) as CookHelpRequest
    const question = body.question?.trim()
    const stepIndex = Number.isInteger(body.stepIndex) ? Number(body.stepIndex) : 0

    if (!question) {
      return Response.json({ error: "Ask a cooking question first." }, { status: 400 })
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

    const currentStep = recipe.steps[Math.max(0, Math.min(stepIndex, recipe.steps.length - 1))]
    const prompt = [
      "You are helping a user while they are actively cooking.",
      "Answer the question with practical, concise, step-aware advice.",
      "Mention visual cues, timing cues, safety notes, or troubleshooting only when relevant.",
      "Do not rewrite the whole recipe unless asked.",
      "",
      `Recipe: ${recipe.title}`,
      `Current step: ${currentStep?.order || 1}. ${currentStep?.description || "Not available"}`,
      `Ingredients: ${recipe.ingredients
        .map((ingredient) => `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`)
        .join(", ")}`,
      `All steps: ${recipe.steps.map((step) => `${step.order}. ${step.description}`).join(" ")}`,
      `Question: ${question}`,
    ].join("\n")

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.55,
            maxOutputTokens: 500,
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
    const answer = extractGeminiText(data)

    if (!answer) {
      return Response.json(
        { error: "Gemini returned no cooking advice." },
        { status: 502 }
      )
    }

    return Response.json({ answer })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Cooking help failed." },
      { status: 500 }
    )
  }
}
