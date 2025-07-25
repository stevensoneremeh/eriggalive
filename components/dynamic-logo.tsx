"use client"

import { useTheme } from "@/contexts/theme-context"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface DynamicLogoProps {
  width?: number
  height?: number
  className?: string
}

export function DynamicLogo({ width = 120, height = 40, className }: DynamicLogoProps) {
  const { resolvedTheme } = useTheme()
  const logoSrc = resolvedTheme === "dark" ? "/images/loggotrans-dark.png" : "/images/loggotrans-light.png"

  return (
    <div className={cn("relative flex items-center", className)}>
      <Image
        src={logoSrc || "/placeholder.svg"}
        alt="Erigga Logo"
        width={width}
        height={height}
        className="w-auto h-8 md:h-10 lg:h-12 object-contain"
        priority
      />
    </div>
  )
}
