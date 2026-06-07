import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { TasteProfileForm } from "@/components/recipes/taste-profile-form"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function TasteProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  const profile = await prisma.tasteProfile.findUnique({
    where: { userId: session.user.id },
  })

  return <TasteProfileForm initialProfile={profile} />
}

export const dynamic = "force-dynamic"
