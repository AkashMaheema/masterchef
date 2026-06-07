"use client"

import { useMemo, useState } from "react"
import { Check, Clipboard, Minus, Plus, ShoppingBasket } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Ingredient = {
  id: string
  name: string
  amount: number
  unit: string
}

type ShoppingRecipe = {
  id: string
  title: string
  description: string
  servings: number
  timeToCook: number
  ingredients: Ingredient[]
}

type ShoppingListBuilderProps = {
  recipes: ShoppingRecipe[]
}

type SelectedRecipe = {
  servings: number
}

const groupKeywords = {
  Produce: ["onion", "carrot", "tomato", "potato", "garlic", "ginger", "leaf", "pepper", "lime", "lemon", "fruit"],
  Protein: ["chicken", "beef", "fish", "egg", "tofu", "pork", "lentil", "bean", "paneer"],
  Dairy: ["milk", "cheese", "butter", "cream", "yogurt", "curd"],
  Pantry: ["rice", "flour", "sugar", "salt", "oil", "spice", "powder", "sauce", "pasta", "noodle"],
}

function ingredientGroup(name: string) {
  const normalized = name.toLowerCase()
  const found = Object.entries(groupKeywords).find(([, keywords]) =>
    keywords.some((keyword) => normalized.includes(keyword))
  )

  return found?.[0] || "Other"
}

function formatAmount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, "").replace(/\.0$/, "")
}

export function ShoppingListBuilder({ recipes }: ShoppingListBuilderProps) {
  const [selected, setSelected] = useState<Record<string, SelectedRecipe>>({})
  const selectedIds = Object.keys(selected)

  const shoppingGroups = useMemo(() => {
    const merged = new Map<string, { name: string; amount: number; unit: string; recipes: string[] }>()

    for (const recipe of recipes) {
      const selection = selected[recipe.id]
      if (!selection) continue

      const multiplier = selection.servings / recipe.servings

      for (const ingredient of recipe.ingredients) {
        const key = `${ingredient.name.toLowerCase()}-${ingredient.unit.toLowerCase()}`
        const existing = merged.get(key)
        const amount = ingredient.amount * multiplier

        if (existing) {
          existing.amount += amount
          existing.recipes.push(recipe.title)
        } else {
          merged.set(key, {
            name: ingredient.name,
            amount,
            unit: ingredient.unit,
            recipes: [recipe.title],
          })
        }
      }
    }

    return Array.from(merged.values()).reduce<Record<string, Array<{ name: string; amount: number; unit: string; recipes: string[] }>>>(
      (groups, item) => {
        const group = ingredientGroup(item.name)
        groups[group] = [...(groups[group] || []), item]
        return groups
      },
      {}
    )
  }, [recipes, selected])

  const listText = useMemo(() => {
    return Object.entries(shoppingGroups)
      .map(([group, items]) => {
        const lines = items.map((item) => `- ${formatAmount(item.amount)} ${item.unit} ${item.name}`)
        return `${group}\n${lines.join("\n")}`
      })
      .join("\n\n")
  }, [shoppingGroups])

  function toggleRecipe(recipe: ShoppingRecipe) {
    setSelected((current) => {
      if (current[recipe.id]) {
        const next = { ...current }
        delete next[recipe.id]
        return next
      }

      return { ...current, [recipe.id]: { servings: recipe.servings } }
    })
  }

  function updateServings(recipeId: string, direction: "up" | "down") {
    setSelected((current) => ({
      ...current,
      [recipeId]: {
        servings: Math.max(
          1,
          Math.min(30, (current[recipeId]?.servings || 1) + (direction === "up" ? 1 : -1))
        ),
      },
    }))
  }

  async function copyList() {
    if (!listText) {
      toast.error("Select at least one recipe first.")
      return
    }

    await navigator.clipboard.writeText(listText)
    toast.success("Shopping list copied.")
  }

  return (
    <div className="container mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <div className="mb-8 flex flex-col gap-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300">
          <ShoppingBasket className="h-4 w-4" />
          Auto Shopping List
        </div>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">
          Build one grocery list from many recipes.
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Pick meals, adjust servings, and Master Chef merges duplicate ingredients into a grouped list.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-3">
          {recipes.map((recipe) => {
            const active = Boolean(selected[recipe.id])

            return (
              <article
                key={recipe.id}
                className={cn(
                  "rounded-2xl border bg-white p-4 shadow-sm transition-colors dark:bg-slate-950",
                  active ? "border-violet-400" : "border-slate-200 dark:border-slate-800"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <button type="button" onClick={() => toggleRecipe(recipe)} className="flex flex-1 gap-3 text-left">
                    <span
                      className={cn(
                        "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                        active ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300"
                      )}
                    >
                      {active && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span>
                      <span className="block font-bold">{recipe.title}</span>
                      <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{recipe.description}</span>
                    </span>
                  </button>

                  {active && (
                    <div className="flex shrink-0 items-center gap-2 rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-900">
                      <button type="button" onClick={() => updateServings(recipe.id, "down")} aria-label="Reduce servings">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{selected[recipe.id].servings}</span>
                      <button type="button" onClick={() => updateServings(recipe.id, "up")} aria-label="Increase servings">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
          {!recipes.length && (
            <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-muted-foreground dark:border-slate-800">
              Add recipes first, then come back to build a shopping list.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold">Shopping list</h2>
              <p className="text-sm text-muted-foreground">{selectedIds.length} recipes selected</p>
            </div>
            <Button onClick={copyList} className="bg-violet-600 text-white hover:bg-violet-700">
              <Clipboard className="h-4 w-4" />
              Copy
            </Button>
          </div>

          <div className="space-y-5">
            {Object.entries(shoppingGroups).map(([group, items]) => (
              <div key={group}>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">{group}</h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={`${item.name}-${item.unit}`}
                      className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-900"
                    >
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{Array.from(new Set(item.recipes)).join(", ")}</p>
                      </div>
                      <p className="shrink-0 font-bold">
                        {formatAmount(item.amount)} {item.unit}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {!selectedIds.length && (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-muted-foreground dark:border-slate-800">
                <ShoppingBasket className="mb-3 h-9 w-9 text-violet-600" />
                Select recipes to generate a combined grocery list.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
