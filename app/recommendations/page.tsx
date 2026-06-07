import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { RecommendationsBoard } from "@/components/recipes/recommendations-board"
import { authOptions } from "@/lib/auth"

export default async function RecommendationsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  return <RecommendationsBoard />
}

export const dynamic = "force-dynamic"
