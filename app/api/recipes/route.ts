import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 })

    const data = await req.json()
    
    if (!data.title || !data.description || !data.timeToCook) {
      return new NextResponse("Missing core fields", { status: 400 })
    }

    const recipe = await prisma.recipe.create({
      data: {
        title: data.title,
        description: data.description,
        image: data.image,
        difficulty: data.difficulty || "MEDIUM",
        timeToCook: Number(data.timeToCook),
        servings: Number(data.servings || 4),
        authorId: session.user.id,
        ingredients: {
          create: data.ingredients?.map((ing: any) => ({
            name: ing.name,
            amount: Number(ing.amount),
            unit: ing.unit
          })) || []
        },
        steps: {
          create: data.steps?.map((step: any, idx: number) => ({
            description: step.description,
            order: idx + 1
          })) || []
        }
      }
    })

    return NextResponse.json(recipe)
  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 })
  }
}
