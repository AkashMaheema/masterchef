type LeftoversRequest = {
  leftovers?: string
  notes?: string
}

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

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return Response.json({ error: "Gemini API key is not configured." }, { status: 500 })
  }

  try {
    const body = (await req.json()) as LeftoversRequest
    const leftovers = body.leftovers?.trim().slice(0, 800)
    const notes = body.notes?.trim().slice(0, 500) || ""

    if (!leftovers) {
      return Response.json({ error: "Describe your leftovers first." }, { status: 400 })
    }

    const prompt = [
      "Turn leftovers into safe, practical next-meal ideas.",
      "Return only valid JSON with keys safetyNote and ideas.",
      "ideas must be an array of 4 objects with title, summary, add, steps, and storageTip.",
      "add and steps must be arrays of strings.",
      "Include food-safety cautions when reheating or storage age matters.",
      "",
      `Leftovers: ${leftovers}`,
      `Notes: ${notes || "None"}`,
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
            maxOutputTokens: 1400,
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
      return Response.json({ error: "Gemini returned no leftover ideas." }, { status: 502 })
    }

    return Response.json({ result: safeParseJson(text) })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Leftover assistant failed." },
      { status: 500 }
    )
  }
}
