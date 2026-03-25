import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { RecipeCard } from "@/components/shared/recipe-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star } from "lucide-react"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      favorites: {
        include: { recipe: true },
        orderBy: { createdAt: "desc" }
      },
      reviews: {
        include: { recipe: true },
        orderBy: { createdAt: "desc" }
      }
    }
  })

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      <div className="mb-10">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2">Welcome, {user.name}</h1>
        <p className="text-muted-foreground text-lg">Manage your favorite recipes and recent activity here.</p>
      </div>

      <Tabs defaultValue="favorites" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8 h-12 items-center bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl">
          <TabsTrigger value="favorites" className="rounded-lg h-full text-base">Favorites</TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-lg h-full text-base">My Reviews</TabsTrigger>
        </TabsList>
        
        <TabsContent value="favorites" className="animate-in fade-in-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {user.favorites.length === 0 ? (
              <p className="col-span-full py-12 text-center text-muted-foreground text-lg">You haven't saved any recipes yet.</p>
            ) : (
              user.favorites.map(fav => (
                <RecipeCard key={fav.id} {...fav.recipe as any} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="animate-in fade-in-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {user.reviews.length === 0 ? (
              <p className="col-span-full py-12 text-center text-muted-foreground text-lg">You haven't reviewed any recipes yet.</p>
            ) : (
              user.reviews.map(rev => (
                <div key={rev.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl flex flex-col gap-4 shadow-md border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg line-clamp-1">{rev.recipe.title}</h3>
                    <div className="flex items-center text-orange-400 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < rev.rating ? 'fill-current text-orange-400' : 'text-slate-200 dark:text-slate-700'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 flex-1">{rev.comment}</p>
                  <p className="text-xs text-muted-foreground text-right">{new Date(rev.createdAt).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
