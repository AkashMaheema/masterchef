import Link from "next/link"
import { Clock, ChefHat, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface RecipeCardProps {
  id: string
  title: string
  description: string
  image: string | null
  timeToCook: number
  difficulty: string
  rating?: number
}

export function RecipeCard({ id, title, description, image, timeToCook, difficulty, rating = 4.5 }: RecipeCardProps) {
  return (
    <Link href={`/recipes/${id}`}>
      <Card className="overflow-hidden transition-all hover:scale-[1.02] hover:shadow-xl rounded-2xl group border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {image ? (
            <img src={image} alt={title} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
              <ChefHat className="h-10 w-10 text-slate-400" />
            </div>
          )}
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-sm dark:bg-slate-900/90 dark:text-slate-200">
            <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
            <span>{rating}</span>
          </div>
        </div>
        <CardContent className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 capitalize">
              {difficulty.toLowerCase()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="mr-1 h-3 w-3" />
              {timeToCook} min
            </div>
          </div>
          <h3 className="font-semibold text-lg line-clamp-1 mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
