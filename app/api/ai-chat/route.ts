import { prisma } from "@/lib/prisma"

type ChatMessage = {
  role: "user" | "model"
  text: string
}

const GEMINI_MODEL = "gemini-2.0-flash"

function toGeminiContents(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    parts: [{ text: message.text }],
  }))
}

function extractTextFromSseChunk(chunk: string) {
  return chunk
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => {
      try {
        const data = JSON.parse(line.slice(6))
        return data.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part.text || "")
          .join("") || ""
      } catch {
        return ""
      }
    })
    .join("")
}

async function getRecipeContext() {
  const recipes = await prisma.recipe.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      ingredients: true,
      steps: { orderBy: { order: "asc" } },
    },
  })

  if (!recipes.length) {
    return "The site does not have saved recipes yet. You can still suggest complete recipes from scratch."
  }

  return recipes
    .map((recipe) => {
      const ingredients = recipe.ingredients
        .map((ingredient) => `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`)
        .join(", ")
      const steps = recipe.steps
        .map((step) => `${step.order}. ${step.description}`)
        .join(" ")

      return [
        `Title: ${recipe.title}`,
        `URL: /recipes/${recipe.id}`,
        `Category: ${recipe.category?.name || "Uncategorized"}`,
        `Difficulty: ${recipe.difficulty}`,
        `Time: ${recipe.timeToCook} minutes`,
        `Servings: ${recipe.servings}`,
        `Description: ${recipe.description}`,
        `Ingredients: ${ingredients || "Not listed"}`,
        `Steps: ${steps || "Not listed"}`,
      ].join("\n")
    })
    .join("\n\n")
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return new Response("Gemini API key is not configured.", { status: 500 })
  }

  try {
    const body = await req.json()
    const messages = Array.isArray(body.messages) ? body.messages : []
    const safeMessages: ChatMessage[] = messages
      .filter(
        (message: Partial<ChatMessage>) =>
          (message.role === "user" || message.role === "model") &&
          typeof message.text === "string" &&
          message.text.trim().length > 0
      )
      .slice(-12)

    if (!safeMessages.length) {
      return new Response("Message is required.", { status: 400 })
    }

    const recipeContext = await getRecipeContext()
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`
    const geminiResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: [
                "You are Master Chef's helpful cooking assistant.",
                "Help users discover recipes, adapt saved recipes, swap ingredients, scale servings, troubleshoot cooking problems, and suggest meal ideas.",
                "When a saved recipe is relevant, mention its title and relative URL.",
                "Be concise, practical, friendly, and cooking-focused.",
                "Do not claim that recipe edits were saved to the database; provide suggested changes the user can review.",
                "",
                "Saved recipe context:",
                recipeContext,
              ].join("\n"),
            },
          ],
        },
        contents: toGeminiContents(safeMessages),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 900,
        },
      }),
    })

    if (!geminiResponse.ok || !geminiResponse.body) {
      const errorText = await geminiResponse.text()
      return new Response(errorText || "Gemini request failed.", {
        status: geminiResponse.status,
      })
    }

    const decoder = new TextDecoder()
    const encoder = new TextEncoder()
    const reader = geminiResponse.body.getReader()

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = ""

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const events = buffer.split("\n\n")
            buffer = events.pop() || ""

            for (const event of events) {
              const text = extractTextFromSseChunk(event)
              if (text) controller.enqueue(encoder.encode(text))
            }
          }

          const finalText = extractTextFromSseChunk(buffer)
          if (finalText) controller.enqueue(encoder.encode(finalText))
        } catch {
          controller.enqueue(
            encoder.encode("Sorry, the cooking assistant lost the connection. Please try again.")
          )
        } finally {
          controller.close()
        }
      },
      cancel() {
        reader.cancel()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    })
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "AI chat failed.", {
      status: 500,
    })
  }
}
