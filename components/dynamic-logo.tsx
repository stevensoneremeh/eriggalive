"use client"

import { useTheme } from "@/contexts/theme-context"
import Image from "next/image"

interface DynamicLogoProps {
  width?: number
  height?: number
  className?: string
}

export function DynamicLogo({ width = 120, height = 32, className }: DynamicLogoProps) {
  const { theme } = useTheme()

  return (
    <div className={className}>
      <Image
        src={theme === "dark" ? "/images/loggotrans-dark.png" : "/images/loggotrans-light.png"}
        alt="Erigga Live"
        width={width}
        height={height}
        priority
        className="object-contain"
      />
    </div>
  )
}
