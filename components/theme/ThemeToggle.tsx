"use client"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const isDark = (theme ?? resolvedTheme) === "dark"

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 border transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <span className="h-4 w-4 rounded-full bg-current" />
      <span className="text-sm">{isDark ? "Dark" : "Light"}</span>
    </button>
  )
}
