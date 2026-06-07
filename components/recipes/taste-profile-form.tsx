"use client"

import { useState } from "react"
import { Heart, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type TasteProfile = {
  cuisines: string[]
  diets: string[]
  spiceLevel: number
  budget: string
  notes?: string | null
}

type TasteProfileFormProps = {
  initialProfile: TasteProfile | null
}

const cuisines = ["Sri Lankan", "Indian", "Italian", "Chinese", "Thai", "Mexican", "Mediterranean", "Middle Eastern"]
const diets = ["Vegetarian", "Vegan", "High protein", "Low carb", "Gluten free", "Dairy free", "Low sugar", "Kid friendly"]
const budgets = ["budget", "balanced", "premium"]

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

export function TasteProfileForm({ initialProfile }: TasteProfileFormProps) {
  const [selectedCuisines, setSelectedCuisines] = useState(initialProfile?.cuisines || ["Sri Lankan"])
  const [selectedDiets, setSelectedDiets] = useState(initialProfile?.diets || [])
  const [spiceLevel, setSpiceLevel] = useState(initialProfile?.spiceLevel || 3)
  const [budget, setBudget] = useState(initialProfile?.budget || "balanced")
  const [notes, setNotes] = useState(initialProfile?.notes || "")
  const [saving, setSaving] = useState(false)

  async function saveProfile() {
    setSaving(true)

    try {
      const response = await fetch("/api/taste-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cuisines: selectedCuisines,
          diets: selectedDiets,
          spiceLevel,
          budget,
          notes,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not save taste profile.")
      }

      toast.success("Taste profile saved.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save taste profile.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto w-full max-w-5xl px-4 py-10 md:px-8 md:py-14">
      <div className="mb-8 flex flex-col gap-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          <Heart className="h-4 w-4" />
          Taste Profile
        </div>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">
          Teach Master Chef what you love.
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          These preferences will power better recommendations, meal plans, and AI suggestions.
        </p>
      </div>

      <section className="space-y-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div>
          <h2 className="mb-3 text-lg font-extrabold">Favorite cuisines</h2>
          <div className="flex flex-wrap gap-2">
            {cuisines.map((cuisine) => (
              <button
                key={cuisine}
                type="button"
                onClick={() => setSelectedCuisines((current) => toggleValue(current, cuisine))}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                  selectedCuisines.includes(cuisine)
                    ? "border-rose-600 bg-rose-600 text-white"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                )}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-extrabold">Diet and goals</h2>
          <div className="flex flex-wrap gap-2">
            {diets.map((diet) => (
              <button
                key={diet}
                type="button"
                onClick={() => setSelectedDiets((current) => toggleValue(current, diet))}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                  selectedDiets.includes(diet)
                    ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                )}
              >
                {diet}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-extrabold">Spice level</h2>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSpiceLevel(level)}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border text-sm font-bold",
                    spiceLevel === level
                      ? "border-rose-600 bg-rose-600 text-white"
                      : "border-slate-200 dark:border-slate-800"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-extrabold">Budget style</h2>
            <div className="flex flex-wrap gap-2">
              {budgets.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setBudget(item)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-bold capitalize",
                    budget === item
                      ? "border-rose-600 bg-rose-600 text-white"
                      : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-extrabold">Extra notes</h2>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="min-h-28"
            placeholder="Allergies, disliked ingredients, cooking equipment, family preferences..."
          />
        </div>

        <Button onClick={saveProfile} disabled={saving} className="h-10 bg-rose-600 text-white hover:bg-rose-700">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save profile
        </Button>
      </section>
    </div>
  )
}
