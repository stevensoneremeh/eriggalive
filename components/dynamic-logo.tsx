"use client"

import { useTheme } from "@/contexts/theme-context"
import { cn } from "@/lib/utils"

interface DynamicLogoProps {
  className?: string
}

export function DynamicLogo({ className }: DynamicLogoProps) {
  const { theme } = useTheme()

  return (
    <div className={cn("relative", className)}>
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-sm">E</span>
      </div>
    </div>
  )
}
