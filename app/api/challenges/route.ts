import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type ChallengeRequest = {
  title?: string
  description?: string
  entryId?: string
}

async function getCurrentChallenge() {
  const existing = await prisma.challenge.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      entries: {
        include: { user: true },
        orderBy: [{ votes: "desc" }, { createdAt: "asc" }],
      },
    },
  })

  if (existing) return existing

  const now = new Date()
  const endsAt = new Date(now)
  endsAt.setDate(now.getDate() + 7)

  return prisma.challenge.create({
    data: {
      title: "15-Minute Dinner Sprint",
      prompt: "Share a fast dinner idea that feels impressive but stays realistic on a busy weeknight.",
      endsAt,
    },
    include: {
      entries: {
        include: { user: true },
        orderBy: [{ votes: "desc" }, { createdAt: "asc" }],
      },
    },
  })
}

export async function GET() {
  const challenge = await getCurrentChallenge()
  return Response.json({ challenge })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = (await req.json()) as ChallengeRequest
    const title = body.title?.trim().slice(0, 100)
    const description = body.description?.trim().slice(0, 800)

    if (!title || !description) {
      return Response.json({ error: "Title and description are required." }, { status: 400 })
    }

    const challenge = await getCurrentChallenge()
    const entry = await prisma.challengeEntry.create({
      data: {
        challengeId: challenge.id,
        userId: session.user.id,
        title,
        description,
      },
      include: { user: true },
    })

    return Response.json({ entry })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Challenge submission failed." },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as ChallengeRequest

    if (!body.entryId) {
      return Response.json({ error: "Entry id is required." }, { status: 400 })
    }

    const entry = await prisma.challengeEntry.update({
      where: { id: body.entryId },
      data: { votes: { increment: 1 } },
      include: { user: true },
    })

    return Response.json({ entry })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Voting failed." },
      { status: 500 }
    )
  }
}
