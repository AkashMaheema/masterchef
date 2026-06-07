"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, Loader2, Sparkles, ThumbsUp } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

type Recommendation = {
  title?: string
  url?: string
  reason?: string
  matchTags?: string[]
  tweak?: string
}

type RecommendationResult = {
  summary?: string
  recommendations?: Recommendation[]
}

export function RecommendationsBoard() {
  const [result, setResult] = useState<RecommendationResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function generateRecommendations() {
    setLoading(true)

    try {
      const response = await fetch("/api/recommendations", { method: "POST" })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not generate recommendations.")
      }

      setResult(data.result)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate recommendations.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <div className="mb-8 flex flex-col gap-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          <ThumbsUp className="h-4 w-4" />
          Personal Recommendations
        </div>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">
          Recipes picked for your taste.
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Master Chef uses your taste profile to explain which saved recipes fit you best.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={generateRecommendations} disabled={loading} className="h-10 bg-amber-600 text-white hover:bg-amber-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate picks
          </Button>
          <Link href="/taste-profile" className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900">
            Edit taste profile
          </Link>
        </div>
      </div>

      {!result ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-muted-foreground dark:border-slate-800">
          <ThumbsUp className="mb-3 h-9 w-9 text-amber-600" />
          Your personalized picks will appear here.
        </div>
      ) : (
        <section className="space-y-6">
          {result.summary && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-sm leading-relaxed text-muted-foreground dark:border-amber-950 dark:bg-amber-950/20">
              {result.summary}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.recommendations?.map((recommendation, index) => (
              <article key={`${recommendation.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h2 className="text-lg font-extrabold">{recommendation.title || "Recommended recipe"}</h2>
                  {recommendation.url && (
                    <Link href={recommendation.url} aria-label="Open recipe">
                      <ArrowRight className="h-5 w-5 text-amber-600" />
                    </Link>
                  )}
                </div>
                {recommendation.reason && <p className="text-sm leading-relaxed text-muted-foreground">{recommendation.reason}</p>}
                {!!recommendation.matchTags?.length && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {recommendation.matchTags.map((tag) => (
                      <span key={tag} className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {recommendation.tweak && (
                  <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-muted-foreground dark:bg-slate-900">
                    {recommendation.tweak}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
