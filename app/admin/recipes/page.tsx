import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Plus, Edit, Trash } from "lucide-react"

export default async function AdminRecipes() {
  const recipes = await prisma.recipe.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: true }
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Manage Recipes</h1>
        <Link 
          href="/admin/recipes/new" 
          className={buttonVariants({ className: "bg-orange-500 hover:bg-orange-600 text-white" })}
        >
          <Plus className="mr-2 h-4 w-4" /> Create Recipe
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900 border-b">
            <tr>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Recipe</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Author</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider hidden md:table-cell">Time</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {recipes.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground text-base">No recipes found.</td>
              </tr>
            ) : (
              recipes.map(recipe => (
                <tr key={recipe.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{recipe.title}</td>
                  <td className="px-6 py-4">{recipe.author.name}</td>
                  <td className="px-6 py-4 hidden md:table-cell">{recipe.timeToCook}m</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"><Edit className="h-4 w-4"/></button>
                      <button className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"><Trash className="h-4 w-4"/></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
