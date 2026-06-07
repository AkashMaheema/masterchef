"use client"

import Link from "next/link"
import { useState } from "react"
import { CalendarDays, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type Meal = {
  title?: string
  source?: string
  url?: string
  reason?: string
}

type PlanDay = {
  day?: string
  breakfast?: Meal
  lunch?: Meal
  dinner?: Meal
  note?: string
}

type MealPlan = {
  summary?: string
  prepPlan?: string[]
  days?: PlanDay[]
}

const dayOptions = [3, 5, 7]

function MealBlock({ label, meal }: { label: string; meal?: Meal }) {
  if (!meal) return null

  const content = (
    <>
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-bold">{meal.title || "Meal idea"}</p>
      {meal.reason && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{meal.reason}</p>}
      {meal.source && <p className="mt-2 text-xs font-semibold text-teal-700 dark:text-teal-300">{meal.source}</p>}
    </>
  )

  if (meal.url) {
    return (
      <Link href={meal.url} className="block rounded-xl bg-slate-50 p-3 transition-colors hover:bg-teal-50 dark:bg-slate-900 dark:hover:bg-teal-950/30">
        {content}
      </Link>
    )
  }

  return <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">{content}</div>
}

export function MealPlanner() {
  const [days, setDays] = useState(7)
  const [preferences, setPreferences] = useState("quick dinners, balanced lunches, budget friendly, Sri Lankan flavors")
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(false)

  async function generatePlan() {
    setLoading(true)

    try {
      const response = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days, preferences }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not generate a meal plan.")
      }

      setPlan(data.plan)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate a meal plan.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <div className="mb-8 flex flex-col gap-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300">
          <CalendarDays className="h-4 w-4" />
          Meal Planner
        </div>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">
          Plan the week without staring at the fridge.
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Generate a meal plan from saved recipes, new AI ideas, and your schedule or diet notes.
        </p>
      </div>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-4 flex flex-wrap gap-2">
          {dayOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDays(option)}
              className={
                days === option
                  ? "rounded-full bg-teal-600 px-4 py-2 text-sm font-bold text-white"
                  : "rounded-full border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
              }
            >
              {option} days
            </button>
          ))}
        </div>

        <Textarea
          value={preferences}
          onChange={(event) => setPreferences(event.target.value)}
          className="mb-4 min-h-24"
          placeholder="Budget, allergies, diet, cooking time, cuisines, family size..."
        />

        <Button onClick={generatePlan} disabled={loading} className="h-10 bg-teal-600 text-white hover:bg-teal-700">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate plan
        </Button>
      </section>

      {!plan ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-muted-foreground dark:border-slate-800">
          <CalendarDays className="mb-3 h-9 w-9 text-teal-600" />
          Your meal plan will appear here.
        </div>
      ) : (
        <section className="space-y-6">
          <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5 dark:border-teal-950 dark:bg-teal-950/20">
            <h2 className="text-xl font-extrabold">Plan summary</h2>
            {plan.summary && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.summary}</p>}
            {!!plan.prepPlan?.length && (
              <ul className="mt-4 grid gap-2 md:grid-cols-2">
                {plan.prepPlan.map((item, index) => (
                  <li key={`${item}-${index}`} className="rounded-xl bg-white p-3 text-sm dark:bg-slate-950">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plan.days?.map((day, index) => (
              <article key={`${day.day}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <h3 className="mb-4 text-lg font-extrabold">{day.day || `Day ${index + 1}`}</h3>
                <div className="space-y-3">
                  <MealBlock label="Breakfast" meal={day.breakfast} />
                  <MealBlock label="Lunch" meal={day.lunch} />
                  <MealBlock label="Dinner" meal={day.dinner} />
                </div>
                {day.note && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-muted-foreground dark:bg-slate-900">{day.note}</p>}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
