import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { RecipeDetailClient } from "@/components/recipes/recipe-detail-client"

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      author: true,
      category: true,
      ingredients: true,
      steps: { orderBy: { order: "asc" } },
      reviews: { include: { user: true } },
    }
  })

  if (!recipe) {
    return notFound()
  }

  // We ensure the client gets clean data avoiding Date object serialization issues
  return <RecipeDetailClient recipe={JSON.parse(JSON.stringify(recipe))} />
}
