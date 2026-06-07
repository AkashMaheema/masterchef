"use client"

import { FormEvent, useState } from "react"
import { Bot, Loader2, Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type CookingModeAssistantProps = {
  recipeId: string
  stepIndex: number
}

type Message = {
  role: "user" | "assistant"
  text: string
}

const suggestions = [
  "What should this look like?",
  "How do I know it is done?",
  "What if I made it too salty?",
]

export function CookingModeAssistant({ recipeId, stepIndex }: CookingModeAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Ask me about this step while you cook.",
    },
  ])
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)

  async function askQuestion(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setMessages((current) => [...current, { role: "user", text: trimmed }])
    setQuestion("")
    setLoading(true)

    try {
      const response = await fetch(`/api/recipes/${recipeId}/cook-help`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, stepIndex }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not get cooking advice.")
      }

      setMessages((current) => [...current, { role: "assistant", text: data.answer }])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not get cooking advice.")
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    askQuestion(question)
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-t border-white/10 bg-white/5 p-4 md:border-l md:border-t-0">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
          <Bot className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Step assistant</p>
          <p className="text-xs text-slate-400">Context-aware help</p>
        </div>
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => askQuestion(suggestion)}
            disabled={loading}
            className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-white/15 disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={message.role === "user" ? "ml-auto max-w-[88%]" : "mr-auto max-w-[88%]"}
          >
            <div
              className={
                message.role === "user"
                  ? "rounded-2xl bg-orange-500 px-3 py-2 text-sm text-white"
                  : "rounded-2xl bg-white/10 px-3 py-2 text-sm leading-relaxed text-slate-100"
              }
            >
              {message.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm text-slate-300">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Checking
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex items-end gap-2">
        <Textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about this step..."
          disabled={loading}
          className="max-h-24 min-h-10 resize-none border-white/10 bg-white/10 text-sm text-white placeholder:text-slate-500"
        />
        <Button
          type="submit"
          size="icon-lg"
          disabled={loading || !question.trim()}
          className="bg-orange-500 text-white hover:bg-orange-600"
          aria-label="Ask cooking assistant"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </aside>
  )
}
