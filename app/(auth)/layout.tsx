export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
      {children}
    </div>
  )
}
