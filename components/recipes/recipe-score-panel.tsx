"use client"

import { useState } from "react"
import { BadgeCheck, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

type RecipeScore = {
  badges?: string[]
  healthScore?: number
  budgetScore?: number
  timeScore?: number
  summary?: string
  improvements?: string[]
}

type RecipeScorePanelProps = {
  recipeId: string
}

function ScorePill({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-2xl bg-white p-4 text-center shadow-sm dark:bg-slate-950">
      <p className="text-sm font-bold text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-extrabold">{value || "-"}/10</p>
    </div>
  )
}

export function RecipeScorePanel({ recipeId }: RecipeScorePanelProps) {
  const [score, setScore] = useState<RecipeScore | null>(null)
  const [loading, setLoading] = useState(false)

  async function generateScore() {
    setLoading(true)

    try {
      const response = await fetch(`/api/recipes/${recipeId}/score`, { method: "POST" })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not score this recipe.")
      }

      setScore(data.score)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not score this recipe.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mb-16">
      <div className="rounded-3xl border border-fuchsia-100 bg-fuchsia-50/70 p-6 dark:border-fuchsia-950/70 dark:bg-fuchsia-950/20 md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-white px-3 py-1 text-sm font-semibold text-fuchsia-700 dark:border-fuchsia-900 dark:bg-slate-950 dark:text-fuchsia-300">
              <BadgeCheck className="h-4 w-4" />
              Health & Budget Score
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight">Understand this recipe at a glance</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Get practical badges, budget guidance, and easy improvement ideas.
            </p>
          </div>
          <Button onClick={generateScore} disabled={loading} className="h-10 bg-fuchsia-600 text-white hover:bg-fuchsia-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Score recipe
          </Button>
        </div>

        {!score ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-fuchsia-200 bg-white/70 p-6 text-center text-sm text-muted-foreground dark:border-fuchsia-950 dark:bg-slate-950/60">
            <BadgeCheck className="mb-3 h-9 w-9 text-fuchsia-600" />
            Recipe scores and badges will appear here.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              <ScorePill label="Health" value={score.healthScore} />
              <ScorePill label="Budget" value={score.budgetScore} />
              <ScorePill label="Time" value={score.timeScore} />
            </div>
            {!!score.badges?.length && (
              <div className="flex flex-wrap gap-2">
                {score.badges.map((badge) => (
                  <span key={badge} className="rounded-full bg-fuchsia-600 px-3 py-1.5 text-sm font-bold text-white">
                    {badge}
                  </span>
                ))}
              </div>
            )}
            {score.summary && <p className="rounded-2xl bg-white p-4 text-sm leading-relaxed text-muted-foreground shadow-sm dark:bg-slate-950">{score.summary}</p>}
            {!!score.improvements?.length && (
              <div className="grid gap-2 md:grid-cols-2">
                {score.improvements.map((item, index) => (
                  <p key={`${item}-${index}`} className="rounded-xl bg-white p-3 text-sm dark:bg-slate-950">
                    {item}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
