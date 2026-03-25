import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Utensils, Users, MessageSquare } from "lucide-react"

export default async function AdminDashboard() {
  const [totalRecipes, totalUsers, totalReviews] = await Promise.all([
    prisma.recipe.count(),
    prisma.user.count(),
    prisma.review.count()
  ])

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8">Dashboard Overview</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm border-0 bg-slate-50 dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Recipes</CardTitle>
            <Utensils className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalRecipes}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-0 bg-slate-50 dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-slate-50 dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalReviews}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
