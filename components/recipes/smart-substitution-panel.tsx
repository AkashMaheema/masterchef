"use client"

import { useState } from "react"
import { Loader2, Replace, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Ingredient = {
  id: string
  name: string
  amount: number
  unit: string
}

type Substitution = {
  name?: string
  amount?: string
  bestFor?: string
  caveat?: string
  confidence?: string
}

type SmartSubstitutionPanelProps = {
  recipeId: string
  ingredients: Ingredient[]
}

const substitutionGoals = ["Vegan", "Dairy free", "Gluten free", "Cheaper", "Lower calorie", "Sri Lankan pantry"]

export function SmartSubstitutionPanel({ recipeId, ingredients }: SmartSubstitutionPanelProps) {
  const [selectedIngredient, setSelectedIngredient] = useState(ingredients[0]?.name || "")
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [substitutions, setSubstitutions] = useState<Substitution[]>([])
  const [loading, setLoading] = useState(false)

  function toggleGoal(goal: string) {
    setSelectedGoals((current) =>
      current.includes(goal)
        ? current.filter((item) => item !== goal)
        : [...current, goal]
    )
  }

  async function findSubstitutions() {
    if (!selectedIngredient) {
      toast.error("Choose an ingredient first.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/recipes/${recipeId}/substitutions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientName: selectedIngredient,
          goals: selectedGoals,
          notes,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not find substitutions.")
      }

      setSubstitutions(data.substitutions || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not find substitutions.")
    } finally {
      setLoading(false)
    }
  }

  if (!ingredients.length) return null

  return (
    <section className="mb-16">
      <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6 dark:border-emerald-950/70 dark:bg-emerald-950/20 md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-slate-950 dark:text-emerald-300">
              <Sparkles className="h-4 w-4" />
              Smart Substitutions
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight">Swap ingredients with confidence</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Pick an ingredient and get alternatives with amounts, best uses, and tradeoffs.
            </p>
          </div>
          <Button
            onClick={findSubstitutions}
            disabled={loading}
            className="h-10 bg-emerald-600 px-4 text-white hover:bg-emerald-700"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Replace className="h-4 w-4" />}
            Find swaps
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-sm font-bold">Ingredient</h4>
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ingredient) => {
                  const active = selectedIngredient === ingredient.name

                  return (
                    <button
                      key={ingredient.id}
                      type="button"
                      onClick={() => setSelectedIngredient(ingredient.name)}
                      className={cn(
                        "rounded-full border px-3 py-2 text-sm font-semibold transition-colors",
                        active
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-slate-950 dark:text-emerald-300"
                      )}
                    >
                      {ingredient.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-bold">Goal</h4>
              <div className="flex flex-wrap gap-2">
                {substitutionGoals.map((goal) => {
                  const active = selectedGoals.includes(goal)

                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={cn(
                        "rounded-full border px-3 py-2 text-sm font-semibold transition-colors",
                        active
                          ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950"
                          : "border-slate-200 bg-white hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
                      )}
                    >
                      {goal}
                    </button>
                  )
                })}
              </div>
            </div>

            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional: I only have coconut milk, no eggs, or need something less spicy..."
              className="min-h-24 bg-white dark:bg-slate-950"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {substitutions.map((substitution, index) => (
              <article
                key={`${substitution.name}-${index}`}
                className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm dark:border-emerald-950 dark:bg-slate-950"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold">{substitution.name || "Substitute"}</h4>
                    <p className="text-sm text-muted-foreground">{substitution.amount || "Use to taste"}</p>
                  </div>
                  {substitution.confidence && (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {substitution.confidence}
                    </span>
                  )}
                </div>
                {substitution.bestFor && (
                  <p className="mb-2 text-sm leading-relaxed">{substitution.bestFor}</p>
                )}
                {substitution.caveat && (
                  <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-muted-foreground dark:bg-slate-900">
                    {substitution.caveat}
                  </p>
                )}
              </article>
            ))}

            {!substitutions.length && (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-white/70 p-6 text-center text-sm text-muted-foreground dark:border-emerald-950 dark:bg-slate-950/60 md:col-span-2">
                <Replace className="mb-3 h-8 w-8 text-emerald-600" />
                Ingredient swaps will appear here.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
