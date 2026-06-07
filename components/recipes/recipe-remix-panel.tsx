"use client"

import { useState } from "react"
import { Loader2, RefreshCcw, Sparkles, Wand2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type RecipeRemixPanelProps = {
  recipeId: string
}

type Remix = {
  title?: string
  summary?: string
  changes?: string[]
  ingredients?: string[]
  steps?: string[]
  tips?: string[]
}

const remixGoals = [
  "Faster",
  "Cheaper",
  "Healthier",
  "High protein",
  "Vegetarian",
  "Spicier",
  "Kid friendly",
  "No oven",
]

function RemixList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null

  return (
    <div>
      <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="rounded-xl bg-white p-3 text-sm leading-relaxed shadow-sm dark:bg-slate-950">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function RecipeRemixPanel({ recipeId }: RecipeRemixPanelProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(["Faster"])
  const [customRequest, setCustomRequest] = useState("")
  const [loading, setLoading] = useState(false)
  const [remix, setRemix] = useState<Remix | null>(null)

  function toggleGoal(goal: string) {
    setSelectedGoals((current) =>
      current.includes(goal)
        ? current.filter((item) => item !== goal)
        : [...current, goal]
    )
  }

  async function remixRecipe() {
    if (!selectedGoals.length && !customRequest.trim()) {
      toast.error("Choose a goal or describe the remix you want.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/recipes/${recipeId}/remix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goals: selectedGoals,
          customRequest,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not remix this recipe.")
      }

      setRemix(data.remix)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remix this recipe.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mb-16">
      <div className="rounded-3xl border border-orange-100 bg-orange-50/70 p-6 shadow-sm dark:border-orange-950/70 dark:bg-orange-950/20 md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1 text-sm font-semibold text-orange-700 dark:border-orange-900 dark:bg-slate-950 dark:text-orange-300">
              <Sparkles className="h-4 w-4" />
              AI Recipe Remix
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight">Change this recipe instantly</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Generate a reviewable version for your budget, diet, ingredients, or cooking setup.
            </p>
          </div>
          <Button
            onClick={remixRecipe}
            disabled={loading}
            className="h-10 bg-orange-500 px-4 text-white hover:bg-orange-600"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            Remix
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {remixGoals.map((goal) => {
                const active = selectedGoals.includes(goal)

                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={cn(
                      "rounded-full border px-3 py-2 text-sm font-semibold transition-colors",
                      active
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-orange-200 bg-white text-orange-800 hover:bg-orange-100 dark:border-orange-900 dark:bg-slate-950 dark:text-orange-300"
                    )}
                  >
                    {goal}
                  </button>
                )
              })}
            </div>

            <Textarea
              value={customRequest}
              onChange={(event) => setCustomRequest(event.target.value)}
              placeholder="Example: make it dairy-free and use ingredients I can find in Sri Lanka"
              className="min-h-28 bg-white dark:bg-slate-950"
            />
          </div>

          <div className="min-h-[260px] rounded-2xl border border-orange-100 bg-white/70 p-4 dark:border-orange-950 dark:bg-slate-950/60 md:p-5">
            {!remix ? (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center text-muted-foreground">
                <RefreshCcw className="mb-3 h-8 w-8 text-orange-500" />
                <p className="max-w-sm text-sm leading-relaxed">
                  Your remixed title, ingredients, steps, and cooking tips will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-extrabold">{remix.title || "Remixed recipe"}</h4>
                  {remix.summary && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{remix.summary}</p>
                  )}
                </div>

                <RemixList title="Changes" items={remix.changes} />
                <RemixList title="Ingredients" items={remix.ingredients} />
                <RemixList title="Steps" items={remix.steps} />
                <RemixList title="Tips" items={remix.tips} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
