"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { ArrowRight, CookingPot, Loader2, Plus, Search, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type RecipeMatch = {
  id: string
  title: string
  description: string
  url: string
  timeToCook: number
  difficulty: string
  category: string
  matchedIngredients: string[]
  missingCount: number
}

type FridgeIdea = {
  title?: string
  summary?: string
  useThese?: string[]
  addThese?: string[]
  steps?: string[]
  tip?: string
}

export function FridgeRecipeFinder() {
  const [ingredientInput, setIngredientInput] = useState("")
  const [ingredients, setIngredients] = useState<string[]>(["rice", "eggs", "carrots"])
  const [notes, setNotes] = useState("")
  const [matches, setMatches] = useState<RecipeMatch[]>([])
  const [ideas, setIdeas] = useState<FridgeIdea[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  function addIngredient(value: string) {
    const next = value.trim().toLowerCase()
    if (!next) return

    setIngredients((current) =>
      current.includes(next) ? current : [...current, next].slice(0, 30)
    )
    setIngredientInput("")
  }

  function handleIngredientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    addIngredient(ingredientInput)
  }

  async function findRecipes() {
    if (!ingredients.length) {
      toast.error("Add at least one ingredient first.")
      return
    }

    setLoading(true)
    setSearched(true)

    try {
      const response = await fetch("/api/fridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, notes }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not find recipe ideas.")
      }

      setMatches(data.matches || [])
      setIdeas(data.ideas || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not find recipe ideas.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <div className="mb-8 flex flex-col gap-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-300">
          <CookingPot className="h-4 w-4" />
          Fridge-to-Recipe
        </div>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">
          Turn what you already have into dinner.
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Add ingredients from your kitchen. Master Chef checks saved recipes first, then creates fresh AI ideas.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <form onSubmit={handleIngredientSubmit} className="mb-4 flex gap-2">
            <Input
              value={ingredientInput}
              onChange={(event) => setIngredientInput(event.target.value)}
              placeholder="Add ingredient"
              className="h-10"
            />
            <Button type="submit" size="icon-lg" aria-label="Add ingredient">
              <Plus className="h-4 w-4" />
            </Button>
          </form>

          <div className="mb-5 flex min-h-20 flex-wrap gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
            {ingredients.map((ingredient) => (
              <button
                key={ingredient}
                type="button"
                onClick={() =>
                  setIngredients((current) => current.filter((item) => item !== ingredient))
                }
                className="inline-flex h-8 items-center gap-2 rounded-full bg-cyan-600 px-3 text-sm font-semibold text-white"
              >
                {ingredient}
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
            {!ingredients.length && (
              <p className="self-center text-sm text-muted-foreground">Your ingredients will appear here.</p>
            )}
          </div>

          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional: no dairy, quick dinner, spicy, cooking for two..."
            className="mb-4 min-h-28"
          />

          <Button
            onClick={findRecipes}
            disabled={loading}
            className="h-10 w-full bg-cyan-600 text-white hover:bg-cyan-700"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Find recipes
          </Button>
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="mb-3 text-xl font-extrabold">Saved recipe matches</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {matches.map((match) => (
                <Link
                  key={match.id}
                  href={match.url}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-cyan-300 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="font-bold">{match.title}</h3>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-cyan-600" />
                  </div>
                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{match.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-900">
                      {match.timeToCook} min
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-900">
                      {match.missingCount} missing
                    </span>
                    {match.matchedIngredients.slice(0, 3).map((ingredient) => (
                      <span key={ingredient} className="rounded-full bg-cyan-50 px-2 py-1 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
              {searched && !loading && !matches.length && (
                <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-muted-foreground dark:border-slate-800">
                  No saved recipes matched those ingredients yet.
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-extrabold">AI ideas</h2>
            <div className="space-y-3">
              {ideas.map((idea, index) => (
                <article
                  key={`${idea.title}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                >
                  <h3 className="text-lg font-bold">{idea.title || "Fridge meal idea"}</h3>
                  {idea.summary && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{idea.summary}</p>
                  )}
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Use these</h4>
                      <p className="text-sm">{idea.useThese?.join(", ") || "Your listed ingredients"}</p>
                    </div>
                    <div>
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Add if needed</h4>
                      <p className="text-sm">{idea.addThese?.join(", ") || "Pantry basics"}</p>
                    </div>
                  </div>
                  {!!idea.steps?.length && (
                    <ol className="mt-4 space-y-2 text-sm leading-relaxed">
                      {idea.steps.map((step, stepIndex) => (
                        <li key={`${step}-${stepIndex}`}>{stepIndex + 1}. {step}</li>
                      ))}
                    </ol>
                  )}
                  {idea.tip && (
                    <p className="mt-4 rounded-xl bg-cyan-50 p-3 text-sm text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200">
                      {idea.tip}
                    </p>
                  )}
                </article>
              ))}
              {searched && !loading && !ideas.length && (
                <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-muted-foreground dark:border-slate-800">
                  No AI ideas yet. Try adding more ingredients or notes.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
