"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import { Bot, ChefHat, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type ChatMessage = {
  role: "user" | "model"
  text: string
}

const quickPrompts = [
  "Suggest a quick dinner from the saved recipes",
  "Make a recipe vegetarian",
  "Help me use chicken, rice, and carrots",
]

export function AiChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "Hi, I can find recipes, adjust ingredients, scale servings, and suggest cooking ideas. What are we making?",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading, open])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const nextMessages: ChatMessage[] = [...messages, { role: "user", text: trimmed }]
    setMessages([...nextMessages, { role: "model", text: "" }])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      })

      if (!response.ok || !response.body) {
        const errorText = await response.text()
        throw new Error(errorText || "The cooking assistant is unavailable.")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        setMessages((current) => {
          const updated = [...current]
          const last = updated[updated.length - 1]
          updated[updated.length - 1] = { ...last, text: last.text + chunk }
          return updated
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong."
      toast.error(message)
      setMessages((current) => {
        const updated = [...current]
        updated[updated.length - 1] = {
          role: "model",
          text: "I could not reach Gemini. Check the API key and try again.",
        }
        return updated
      })
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    sendMessage(input)
  }

  return (
    <>
      <div
        className={cn(
          "fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-[390px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 transition-all duration-200 dark:border-slate-800 dark:bg-slate-950",
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-900 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Recipe Assistant</p>
              <p className="text-xs text-muted-foreground">Live Gemini chat</p>
            </div>
          </div>
          <Button size="icon-sm" variant="ghost" onClick={() => setOpen(false)} aria-label="Close recipe assistant">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-[390px] space-y-4 overflow-y-auto px-4 py-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={cn("flex gap-2", message.role === "user" ? "justify-end" : "justify-start")}
            >
              {message.role === "model" && (
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-300">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[78%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
                    : "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100"
                )}
              >
                {message.text || (
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Thinking
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-100 p-3 dark:border-slate-900">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={loading}
                onClick={() => sendMessage(prompt)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100 disabled:opacity-50 dark:border-orange-900/70 dark:bg-orange-950/30 dark:text-orange-300"
              >
                <Sparkles className="h-3 w-3" />
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  sendMessage(input)
                }
              }}
              placeholder="Ask for recipe ideas, swaps, or changes..."
              className="max-h-28 min-h-11 resize-none bg-slate-50 text-sm dark:bg-slate-900"
              disabled={loading}
            />
            <Button
              type="submit"
              size="icon-lg"
              className="bg-orange-500 text-white hover:bg-orange-600"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>

      <Button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-orange-500 text-white shadow-xl shadow-orange-500/30 hover:bg-orange-600"
        aria-label="Open recipe assistant"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </>
  )
}
