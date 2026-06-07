"use client"

import { FormEvent, useState } from "react"
import { Loader2, Send, Trophy } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type ChallengeEntry = {
  id: string
  title: string
  description: string
  votes: number
  user?: {
    name?: string | null
  }
}

type Challenge = {
  id: string
  title: string
  prompt: string
  endsAt: string
  entries: ChallengeEntry[]
}

type ChallengeBoardProps = {
  initialChallenge: Challenge
  canSubmit: boolean
}

export function ChallengeBoard({ initialChallenge, canSubmit }: ChallengeBoardProps) {
  const [challenge, setChallenge] = useState(initialChallenge)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [votingId, setVotingId] = useState<string | null>(null)

  async function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not submit entry.")
      }

      setChallenge((current) => ({
        ...current,
        entries: [data.entry, ...current.entries],
      }))
      setTitle("")
      setDescription("")
      toast.success("Challenge entry submitted.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit entry.")
    } finally {
      setSubmitting(false)
    }
  }

  async function vote(entryId: string) {
    setVotingId(entryId)

    try {
      const response = await fetch("/api/challenges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not vote.")
      }

      setChallenge((current) => ({
        ...current,
        entries: current.entries
          .map((entry) => (entry.id === entryId ? data.entry : entry))
          .sort((a, b) => b.votes - a.votes),
      }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not vote.")
    } finally {
      setVotingId(null)
    }
  }

  return (
    <div className="container mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <div className="mb-8 flex flex-col gap-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-sm font-semibold text-yellow-700 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-300">
          <Trophy className="h-4 w-4" />
          Community Challenge
        </div>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">{challenge.title}</h1>
        <p className="max-w-2xl text-muted-foreground">{challenge.prompt}</p>
        <p className="text-sm font-semibold text-muted-foreground">
          Ends {new Date(challenge.endsAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="mb-4 text-xl font-extrabold">Submit your idea</h2>
          {canSubmit ? (
            <form onSubmit={submitEntry} className="space-y-4">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Recipe idea title" />
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-36"
                placeholder="Describe the recipe, why it fits, and any special trick..."
              />
              <Button disabled={submitting || !title.trim() || !description.trim()} className="h-10 bg-yellow-600 text-white hover:bg-yellow-700">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit entry
              </Button>
            </form>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-muted-foreground dark:border-slate-800">
              Log in to submit a challenge entry.
            </p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-extrabold">Leaderboard</h2>
          {challenge.entries.map((entry, index) => (
            <article key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-yellow-700 dark:text-yellow-300">Rank {index + 1}</p>
                  <h3 className="text-lg font-extrabold">{entry.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">By {entry.user?.name || "Community cook"}</p>
                </div>
                <Button
                  onClick={() => vote(entry.id)}
                  disabled={votingId === entry.id}
                  className="bg-yellow-600 text-white hover:bg-yellow-700"
                >
                  {votingId === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
                  {entry.votes}
                </Button>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{entry.description}</p>
            </article>
          ))}
          {!challenge.entries.length && (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-muted-foreground dark:border-slate-800">
              <Trophy className="mb-3 h-9 w-9 text-yellow-600" />
              No entries yet. Be the first to submit.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
