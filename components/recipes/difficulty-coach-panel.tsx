"use client"

import { useState } from "react"
import { GraduationCap, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

type CoachMode = "beginner" | "confident" | "pro"

type Coach = {
  title?: string
  overview?: string
  coachedSteps?: string[]
  watchFor?: string[]
  confidenceTip?: string
}

type DifficultyCoachPanelProps = {
  recipeId: string
}

const modes: Array<{ id: CoachMode; label: string }> = [
  { id: "beginner", label: "Beginner" },
  { id: "confident", label: "Confident" },
  { id: "pro", label: "Pro" },
]

export function DifficultyCoachPanel({ recipeId }: DifficultyCoachPanelProps) {
  const [mode, setMode] = useState<CoachMode>("beginner")
  const [coach, setCoach] = useState<Coach | null>(null)
  const [loading, setLoading] = useState(false)

  async function generateCoach(nextMode = mode) {
    setMode(nextMode)
    setLoading(true)

    try {
      const response = await fetch(`/api/recipes/${recipeId}/coach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: nextMode }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not create coaching notes.")
      }

      setCoach(data.coach)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create coaching notes.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mb-16">
      <div className="rounded-3xl border border-sky-100 bg-sky-50/70 p-6 dark:border-sky-950/70 dark:bg-sky-950/20 md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-sm font-semibold text-sky-700 dark:border-sky-900 dark:bg-slate-950 dark:text-sky-300">
              <GraduationCap className="h-4 w-4" />
              Difficulty Coach
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight">Make the recipe match your skill level</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Get beginner-friendly explanations, balanced guidance, or pro-level technique notes.
            </p>
          </div>
          <Button onClick={() => generateCoach()} disabled={loading} className="h-10 bg-sky-600 text-white hover:bg-sky-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Coach me
          </Button>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => generateCoach(item.id)}
              disabled={loading}
              className={
                mode === item.id
                  ? "rounded-full bg-sky-600 px-4 py-2 text-sm font-bold text-white"
                  : "rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-bold text-sky-800 hover:bg-sky-100 disabled:opacity-50 dark:border-sky-900 dark:bg-slate-950 dark:text-sky-300"
              }
            >
              {item.label}
            </button>
          ))}
        </div>

        {!coach ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-sky-200 bg-white/70 p-6 text-center text-sm text-muted-foreground dark:border-sky-950 dark:bg-slate-950/60">
            <GraduationCap className="mb-3 h-9 w-9 text-sky-600" />
            Coaching notes will appear here.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-950">
              <h4 className="text-xl font-extrabold">{coach.title || "Coached recipe"}</h4>
              {coach.overview && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{coach.overview}</p>}
              <ol className="mt-5 space-y-3">
                {coach.coachedSteps?.map((step, index) => (
                  <li key={`${step}-${index}`} className="rounded-xl bg-slate-50 p-3 text-sm leading-relaxed dark:bg-slate-900">
                    {index + 1}. {step}
                  </li>
                ))}
              </ol>
            </div>
            <div className="space-y-4">
              {!!coach.watchFor?.length && (
                <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-950">
                  <h4 className="mb-3 font-bold">Watch for</h4>
                  <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                    {coach.watchFor.map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {coach.confidenceTip && (
                <p className="rounded-2xl bg-sky-600 p-5 text-sm leading-relaxed text-white">
                  {coach.confidenceTip}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
