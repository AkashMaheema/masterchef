"use client"

import { useState } from "react"
import { Loader2, RefreshCw, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type LeftoverIdea = {
  title?: string
  summary?: string
  add?: string[]
  steps?: string[]
  storageTip?: string
}

type LeftoverResult = {
  safetyNote?: string
  ideas?: LeftoverIdea[]
}

export function LeftoverAssistant() {
  const [leftovers, setLeftovers] = useState("leftover rice, chicken curry, and steamed vegetables from yesterday")
  const [notes, setNotes] = useState("quick dinner, not too spicy")
  const [result, setResult] = useState<LeftoverResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function generateIdeas() {
    if (!leftovers.trim()) {
      toast.error("Describe your leftovers first.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/leftovers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leftovers, notes }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not create leftover ideas.")
      }

      setResult(data.result)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create leftover ideas.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <div className="mb-8 flex flex-col gap-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-3 py-1 text-sm font-semibold text-lime-700 dark:border-lime-900 dark:bg-lime-950/40 dark:text-lime-300">
          <RefreshCw className="h-4 w-4" />
          Leftover Assistant
        </div>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">
          Give leftovers a second life.
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Describe what is cooked, how old it is, and what mood you are in. Get safe, practical next-meal ideas.
        </p>
      </div>

      <section className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:grid-cols-2">
        <Textarea
          value={leftovers}
          onChange={(event) => setLeftovers(event.target.value)}
          className="min-h-32"
          placeholder="Example: cooked rice from yesterday, grilled chicken, half an onion..."
        />
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="min-h-32"
          placeholder="Optional: time, diet, spice, pantry items, equipment..."
        />
        <Button onClick={generateIdeas} disabled={loading} className="h-10 bg-lime-600 text-white hover:bg-lime-700 md:col-span-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate leftover ideas
        </Button>
      </section>

      {!result ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-muted-foreground dark:border-slate-800">
          <RefreshCw className="mb-3 h-9 w-9 text-lime-600" />
          Leftover ideas will appear here.
        </div>
      ) : (
        <section className="space-y-5">
          {result.safetyNote && (
            <p className="rounded-2xl border border-lime-100 bg-lime-50 p-4 text-sm leading-relaxed text-lime-900 dark:border-lime-950 dark:bg-lime-950/30 dark:text-lime-200">
              {result.safetyNote}
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {result.ideas?.map((idea, index) => (
              <article key={`${idea.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <h2 className="text-lg font-extrabold">{idea.title || "Leftover idea"}</h2>
                {idea.summary && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{idea.summary}</p>}
                {!!idea.add?.length && (
                  <p className="mt-4 text-sm">
                    <span className="font-bold">Add: </span>
                    {idea.add.join(", ")}
                  </p>
                )}
                {!!idea.steps?.length && (
                  <ol className="mt-4 space-y-2 text-sm leading-relaxed">
                    {idea.steps.map((step, stepIndex) => (
                      <li key={`${step}-${stepIndex}`}>{stepIndex + 1}. {step}</li>
                    ))}
                  </ol>
                )}
                {idea.storageTip && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-muted-foreground dark:bg-slate-900">{idea.storageTip}</p>}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
