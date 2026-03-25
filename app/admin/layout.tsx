import Link from "next/link"
import { LayoutDashboard, Utensils, Users, MessageSquare } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row flex-1 w-full h-full">
      <aside className="w-full md:w-64 border-r bg-slate-50 dark:bg-slate-900/40 p-4 shrink-0 h-full min-h-[calc(100vh-4rem)]">
        <nav className="flex flex-col gap-2 sticky top-[5rem]">
          <Link href="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 transition-colors">
            <LayoutDashboard className="h-4 w-4" /> Overview
          </Link>
          <Link href="/admin/recipes" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
            <Utensils className="h-4 w-4" /> Recipes
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
            <Users className="h-4 w-4" /> Users
          </Link>
          <Link href="/admin/reviews" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
            <MessageSquare className="h-4 w-4" /> Reviews
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8 w-full max-w-[100vw]">
        {children}
      </main>
    </div>
  )
}
