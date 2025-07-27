"use client"

import Image from "next/image"
import { useTheme } from "@/contexts/theme-context"
import { cn } from "@/lib/utils"

interface DynamicLogoProps {
  width?: number
  height?: number
  className?: string
}

export function DynamicLogo({ width = 140, height = 38, className }: DynamicLogoProps) {
  const { resolvedTheme } = useTheme()

  const logoSrc = resolvedTheme === "dark" ? "/images/loggotrans-dark.png" : "/images/loggotrans-light.png"

  return (
    <Image
      src={logoSrc || "/placeholder.svg"}
      alt="Erigga Live"
      width={width}
      height={height}
      className={cn("object-contain", className)}
      priority
    />
  )
}
