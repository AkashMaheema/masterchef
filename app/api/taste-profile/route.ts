import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type TasteProfileRequest = {
  cuisines?: string[]
  diets?: string[]
  spiceLevel?: number
  budget?: string
  notes?: string
}

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const profile = await prisma.tasteProfile.findUnique({
    where: { userId: session.user.id },
  })

  return Response.json({ profile })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = (await req.json()) as TasteProfileRequest
    const cuisines = Array.isArray(body.cuisines) ? body.cuisines.filter(Boolean).slice(0, 12) : []
    const diets = Array.isArray(body.diets) ? body.diets.filter(Boolean).slice(0, 12) : []
    const spiceLevel = Math.max(1, Math.min(5, Number(body.spiceLevel || 3)))
    const budget = typeof body.budget === "string" ? body.budget : "balanced"
    const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 800) : ""

    const profile = await prisma.tasteProfile.upsert({
      where: { userId: session.user.id },
      update: { cuisines, diets, spiceLevel, budget, notes },
      create: {
        userId: session.user.id,
        cuisines,
        diets,
        spiceLevel,
        budget,
        notes,
      },
    })

    return Response.json({ profile })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not save taste profile." },
      { status: 500 }
    )
  }
}
