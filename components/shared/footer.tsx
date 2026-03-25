import Link from "next/link"
import { ChefHat } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t bg-background py-6 md:py-8 mt-auto">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:h-16 md:flex-row md:px-8">
        <div className="flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-orange-500" />
          <p className="text-sm leading-loose text-center text-muted-foreground md:text-left">
            Built by Master Chef. The ultimate recipe platform.
          </p>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:underline underline-offset-4 hover:text-orange-500">Terms</Link>
          <Link href="/privacy" className="hover:underline underline-offset-4 hover:text-orange-500">Privacy</Link>
        </div>
      </div>
    </footer>
  )
}
