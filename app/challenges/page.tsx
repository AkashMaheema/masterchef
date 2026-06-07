import { getServerSession } from "next-auth"

import { ChallengeBoard } from "@/components/recipes/challenge-board"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

export default async function ChallengesPage() {
  const session = await getServerSession(authOptions)
  const challenge = await getCurrentChallenge()

  return (
    <ChallengeBoard
      initialChallenge={JSON.parse(JSON.stringify(challenge))}
      canSubmit={Boolean(session?.user?.id)}
    />
  )
}

export const dynamic = "force-dynamic"
