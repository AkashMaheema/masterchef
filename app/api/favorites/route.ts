import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { recipeId } = await req.json()
    if (!recipeId) return new NextResponse("Recipe ID required", { status: 400 })

    const favorite = await prisma.favorite.create({
      data: { userId: session.user.id, recipeId }
    })
    return NextResponse.json(favorite)
  } catch (err: any) {
    if (err.code === 'P2002') return new NextResponse("Already favorited", { status: 400 })
    return new NextResponse(err.message, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const url = new URL(req.url)
    const recipeId = url.searchParams.get("recipeId")
    if (!recipeId) return new NextResponse("Recipe ID required", { status: 400 })

    await prisma.favorite.delete({
      where: { userId_recipeId: { userId: session.user.id, recipeId } }
    })
    return new NextResponse("Deleted", { status: 200 })
  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 })
  }
}
