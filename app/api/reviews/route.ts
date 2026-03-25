import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { recipeId, rating, comment } = await req.json()
    if (!recipeId || !rating) return new NextResponse("Recipe ID and rating required", { status: 400 })

    const review = await prisma.review.create({
      data: { userId: session.user.id, recipeId, rating, comment }
    })
    return NextResponse.json(review)
  } catch (err: any) {
    if (err.code === 'P2002') return new NextResponse("Already reviewed", { status: 400 })
    return new NextResponse(err.message, { status: 500 })
  }
}
