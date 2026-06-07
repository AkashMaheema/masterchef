"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Clock, ChefHat, Users, Star, ArrowLeft, Download, Maximize2, Play, CheckCircle2 } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { RecipeRemixPanel } from "@/components/recipes/recipe-remix-panel"
import { SmartSubstitutionPanel } from "@/components/recipes/smart-substitution-panel"
import { CookingModeAssistant } from "@/components/recipes/cooking-mode-assistant"
import { DifficultyCoachPanel } from "@/components/recipes/difficulty-coach-panel"
import { RecipeScorePanel } from "@/components/recipes/recipe-score-panel"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import Link from "next/link"

export function RecipeDetailClient({ recipe }: { recipe: any }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [servings, setServings] = useState(recipe.servings)
  const [activeStep, setActiveStep] = useState(0)
  const recipeRef = useRef<HTMLDivElement>(null)

  const handleDownloadPdf = async () => {
    if (!recipeRef.current) return
    toast.info("Generating PDF...")
    try {
      const canvas = await html2canvas(recipeRef.current)
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${recipe.title.replace(/\s+/g, "_")}.pdf`)
      toast.success("PDF downloaded!")
    } catch (e) {
      toast.error("Failed to generate PDF.")
    }
  }

  const multiplier = servings / recipe.servings

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
      <Link href="/recipes" className="inline-flex items-center text-sm text-muted-foreground hover:text-orange-500 mb-6 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Recipes
      </Link>

      <div ref={recipeRef} className="bg-white dark:bg-slate-950 p-2 md:p-6 rounded-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-16">
          {/* Image */}
          <div className="relative aspect-square md:aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
            {recipe.image ? (
              <img src={recipe.image} alt={recipe.title} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <ChefHat className="h-24 w-24 text-slate-300" />
              </div>
            )}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button size="icon" variant="secondary" className="rounded-full shadow-lg" onClick={handleDownloadPdf}>
                <Download className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 text-sm font-semibold capitalize">
                {recipe.difficulty.toLowerCase()}
              </span>
              {recipe.category && (
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-sm font-medium">
                  {recipe.category.name}
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">{recipe.title}</h1>
            <p className="text-lg text-muted-foreground mb-8">{recipe.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm"><Clock className="h-5 w-5 text-orange-500" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-semibold">{recipe.timeToCook} mins</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm"><Users className="h-5 w-5 text-blue-500" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Yield</p>
                  <p className="font-semibold">{recipe.servings} servings</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${recipe.author.name}`} alt={recipe.author.name} className="w-12 h-12 rounded-full border-2 border-slate-100 dark:border-slate-800" />
              <div>
                <p className="text-sm text-muted-foreground">Created by</p>
                <p className="font-semibold">{recipe.author.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical Layout Sections */}

        <RecipeRemixPanel recipeId={recipe.id} />

        <RecipeScorePanel recipeId={recipe.id} />

        {/* Ingredients Section */}
        <section className="mb-16">
          <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <h3 className="text-2xl font-extrabold">Ingredients</h3>
              <div className="flex items-center gap-4 bg-white dark:bg-slate-950 px-5 py-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <span className="text-sm font-medium">Servings: {servings}</span>
                <div className="w-32">
                  <Slider 
                    value={[servings]} max={20} min={1} step={1} 
                    onValueChange={(vals: any) => setServings(Array.isArray(vals) ? vals[0] : vals)}
                  />
                </div>
              </div>
            </div>
            
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recipe.ingredients.map((ing: any) => (
                <li key={ing.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-950 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-orange-200 dark:hover:border-orange-900/50 transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
                    <CheckCircle2 className="h-5 w-5 text-orange-600 dark:text-orange-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-lg leading-none mb-1">
                      {(ing.amount * multiplier).toFixed(1).replace(/\.0$/, '')} {ing.unit}
                    </span>
                    <span className="text-muted-foreground text-sm">{ing.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <SmartSubstitutionPanel recipeId={recipe.id} ingredients={recipe.ingredients} />

        <DifficultyCoachPanel recipeId={recipe.id} />

        {/* Instructions Section */}
        <section className="mb-16 md:px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <h3 className="text-2xl font-extrabold">Step-by-Step</h3>
            <Dialog>
              <DialogTrigger className={buttonVariants({ variant: "default", className: "rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl" })}>
                <Maximize2 className="mr-2 h-4 w-4" /> Cooking Mode
              </DialogTrigger>
              <DialogContent className="h-[86vh] max-w-6xl rounded-3xl border-0 bg-slate-950 p-0 text-white overflow-hidden">
                <div className="grid h-full min-h-0 grid-rows-[1fr_340px] md:grid-cols-[1fr_340px] md:grid-rows-1">
                  <div className="relative flex min-h-0 flex-col items-center justify-center p-8 text-center md:p-16">
                    <div className="absolute left-6 top-6 text-sm font-medium uppercase tracking-widest text-slate-500">
                      Step {activeStep + 1} of {recipe.steps.length}
                    </div>
                    
                    <h2 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                      {recipe.steps[activeStep]?.description}
                    </h2>

                    <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4 px-6 md:gap-8 md:px-8">
                      <Button variant="ghost" className="text-slate-400 hover:text-white"
                        disabled={activeStep === 0} onClick={() => setActiveStep(prev => prev - 1)}>
                        Previous
                      </Button>
                      
                      <div className="flex gap-2">
                        {recipe.steps.map((_: any, idx: number) => (
                          <div key={idx} className={`h-2 rounded-full transition-all ${idx === activeStep ? 'w-8 bg-orange-500' : 'w-2 bg-slate-800'}`} />
                        ))}
                      </div>

                      <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-5 md:px-8"
                        disabled={activeStep === recipe.steps.length - 1} onClick={() => setActiveStep(prev => prev + 1)}>
                        Next
                      </Button>
                    </div>
                  </div>
                  <CookingModeAssistant recipeId={recipe.id} stepIndex={activeStep} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-6">
            {recipe.steps.map((step: any, idx: number) => (
              <div key={step.id} className="flex gap-6 group bg-slate-50 dark:bg-slate-900/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 font-bold text-xl ring-4 ring-white dark:ring-slate-950 shadow-sm">
                    {step.order}
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 font-medium">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews Section */}
        <section className="mb-8 relative overflow-hidden w-full pt-8 border-t border-slate-100 dark:border-slate-900">
          <h3 className="text-2xl font-extrabold mb-8 md:px-4">Reviews & Comments</h3>
          
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes marquee {
              0% { transform: translateX(0%); }
              100% { transform: translateX(calc(-50% - 12px)); }
            }
            .animate-marquee {
              animation: marquee 40s linear infinite;
            }
            .animate-marquee:hover {
              animation-play-state: paused;
            }
          `}} />
          
          {recipe.reviews.length === 0 ? (
            <div className="md:px-4">
              <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 p-8 rounded-3xl text-center">
                <p className="text-orange-800 dark:text-orange-300 font-medium">No reviews yet. Be the first to try this recipe!</p>
              </div>
            </div>
          ) : (
            <div className="flex w-max animate-marquee gap-6 py-4">
              {/* Duplicate reviews multiple times to ensure the loop fills the screen flawlessly */}
              {[...recipe.reviews, ...recipe.reviews, ...recipe.reviews, ...recipe.reviews].map((rev: any, i: number) => (
                <div key={`${rev.id}-${i}`} className="w-[320px] md:w-[380px] shrink-0 bg-white dark:bg-slate-950 p-6 md:p-8 rounded-3xl flex flex-col gap-5 shadow-xl shadow-slate-200/20 dark:shadow-none border border-slate-100 dark:border-slate-800 hover:-translate-y-1 transition-transform cursor-pointer">
                  <div className="flex items-center gap-4">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${rev.user.name}`} alt={rev.user.name} className="w-14 h-14 rounded-full bg-slate-100 border-2 border-slate-50 dark:border-slate-800" />
                    <div>
                      <p className="font-bold text-lg">{rev.user.name}</p>
                      <div className="flex items-center text-orange-400 mt-1">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} className={`w-4 h-4 ${idx < rev.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic line-clamp-4">"{rev.comment}"</p>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
