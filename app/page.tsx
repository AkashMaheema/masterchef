import { prisma } from "@/lib/prisma"
import { RecipeCard } from "@/components/shared/recipe-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Sparkles } from "lucide-react"
import Link from "next/link"

export default async function Home() {
  const featuredRecipes = await prisma.recipe.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-50 py-20 dark:bg-slate-900/50">
        <div className="container relative mx-auto px-4 md:px-8 flex flex-col items-center text-center">
          <div className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-sm text-orange-600 dark:text-orange-400 mb-8">
            <Sparkles className="mr-2 h-4 w-4" />
            Discover your next favorite meal
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl leading-tight">
            Cook like a <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Master Chef</span> every single day.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl">
            Explore thousands of recipes, scale ingredients instantly, and cook step-by-step with our smart cooking tools.
          </p>
          
          <div className="w-full max-w-xl flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search for recipes, ingredients..." 
                className="pl-12 h-14 rounded-full text-base bg-white dark:bg-slate-950 shadow-sm border-slate-200 dark:border-slate-800"
              />
            </div>
            <Link href="/recipes" className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-14 rounded-full px-8 text-base bg-orange-500 hover:bg-orange-600 text-white shadow-md w-full sm:w-auto">
              Search
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Recipes Section */}
      <section className="py-20 container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold tracking-tight">Featured Weekly</h2>
          <Link href="/recipes" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} {...recipe} />
          ))}
        </div>
      </section>
    </div>
  )
}

export const dynamic = "force-dynamic"
