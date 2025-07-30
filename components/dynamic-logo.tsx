"use client"

import { useTheme } from "@/contexts/theme-context"
import { cn } from "@/lib/utils"

interface DynamicLogoProps {
  className?: string
}

export function DynamicLogo({ className }: DynamicLogoProps) {
  const { theme, mounted } = useTheme()

  if (!mounted) {
    return <div className={cn("h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full", className)} />
  }

  return (
    <div className={cn("relative", className)}>
      <div className="w-full h-full rounded-lg bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-lg">E</span>
      </div>
    </div>
  )
}
