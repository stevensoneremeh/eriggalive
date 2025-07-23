"use client"

import { useTheme } from "@/contexts/theme-context"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface DynamicLogoProps {
  width?: number
  height?: number
  className?: string
}

export function DynamicLogo({ width = 120, height = 32, className }: DynamicLogoProps) {
  const { theme, resolvedTheme } = useTheme()

  // Determine which logo to show based on theme
  const logoSrc = resolvedTheme === "dark" ? "/images/loggotrans-dark.png" : "/images/loggotrans-light.png"

  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src={logoSrc || "/placeholder.svg"}
        alt="EriggaLive Logo"
        width={width}
        height={height}
        priority
        className="object-contain"
        onError={(e) => {
          // Fallback to text logo if image fails
          const target = e.target as HTMLImageElement
          target.style.display = "none"
          const parent = target.parentElement
          if (parent) {
            parent.innerHTML = `
              <span class="font-bold text-xl bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                EriggaLive
              </span>
            `
          }
        }}
      />
    </div>
  )
}
