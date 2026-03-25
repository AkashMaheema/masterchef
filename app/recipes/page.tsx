import { prisma } from "@/lib/prisma"
import { RecipeCard } from "@/components/shared/recipe-card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default async function RecipesPage() {
  const recipes = await prisma.recipe.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true }
  })

  return (
    <div className="container mx-auto px-4 py-12 md:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">All Recipes</h1>
          <p className="text-muted-foreground text-lg">Browse our entire collection of culinary delights.</p>
        </div>
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search recipes..." className="pl-9 bg-white dark:bg-slate-950 shadow-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recipes.length === 0 ? (
          <p className="col-span-full text-center py-20 text-muted-foreground text-lg">
            No recipes found. Check back later!
          </p>
        ) : (
          recipes.map(recipe => (
            <RecipeCard key={recipe.id} {...recipe as any} />
          ))
        )}
      </div>
    </div>
  )
}

export const dynamic = "force-dynamic"
