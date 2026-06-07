import { ShoppingListBuilder } from "@/components/recipes/shopping-list-builder"
import { prisma } from "@/lib/prisma"

export default async function ShoppingListPage() {
  const recipes = await prisma.recipe.findMany({
    orderBy: { createdAt: "desc" },
    include: { ingredients: true },
  })

  return <ShoppingListBuilder recipes={JSON.parse(JSON.stringify(recipes))} />
}

export const dynamic = "force-dynamic"
