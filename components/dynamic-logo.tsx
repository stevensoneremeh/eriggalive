"use client"

import { useTheme } from "@/contexts/theme-context"
import { cn } from "@/lib/utils"

interface DynamicLogoProps {
  className?: string
}

export function DynamicLogo({ className }: DynamicLogoProps) {
  const { theme } = useTheme()

  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={theme === "dark" ? "/images/loggotrans-dark.png" : "/images/loggotrans-light.png"}
        alt="Erigga Live"
        className="h-8 w-auto"
        onError={(e) => {
          // Fallback to text logo if image fails to load
          const target = e.target as HTMLImageElement
          target.style.display = "none"
          const textLogo = document.createElement("span")
          textLogo.textContent = "Erigga Live"
          textLogo.className = "text-xl font-bold text-primary"
          target.parentNode?.appendChild(textLogo)
        }}
      />
    </div>
  )
}
