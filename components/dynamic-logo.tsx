"use client"

import { useTheme } from "@/contexts/theme-context"
import { cn } from "@/lib/utils"

interface DynamicLogoProps {
  className?: string
}

export function DynamicLogo({ className }: DynamicLogoProps) {
  const { theme, mounted } = useTheme()

  if (!mounted) {
    return <div className={cn("rounded-full bg-gradient-to-r from-blue-500 to-purple-600", className)} />
  }

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white",
        isDark ? "bg-gradient-to-r from-blue-400 to-purple-500" : "bg-gradient-to-r from-blue-600 to-purple-700",
        className,
      )}
    >
      E
    </div>
  )
}
