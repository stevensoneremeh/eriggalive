"use client"

import { useThemeContext } from "@/contexts/theme-context"
import { cn } from "@/lib/utils"

interface DynamicLogoProps {
  className?: string
}

export function DynamicLogo({ className }: DynamicLogoProps) {
  const { theme, mounted } = useThemeContext()

  if (!mounted) {
    return <div className={cn("h-8 w-8 bg-muted rounded animate-pulse", className)} />
  }

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500",
        className,
      )}
    >
      <span className="text-white font-bold text-sm">E</span>
    </div>
  )
}
