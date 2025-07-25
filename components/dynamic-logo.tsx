"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface DynamicLogoProps {
  width?: number
  height?: number
  className?: string
}

export function DynamicLogo({ width = 120, height = 32, className }: DynamicLogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={cn("bg-muted animate-pulse rounded", className)} style={{ width, height }} />
  }

  const logoSrc = resolvedTheme === "dark" ? "/images/loggotrans-dark.png" : "/images/loggotrans-light.png"

  return (
    <Image
      src={logoSrc || "/placeholder.svg"}
      alt="Erigga"
      width={width}
      height={height}
      className={cn("object-contain", className)}
      priority
      onError={(e) => {
        console.error("Logo failed to load:", e)
        // Fallback to text logo
        e.currentTarget.style.display = "none"
        if (e.currentTarget.nextSibling) {
          e.currentTarget.nextSibling.style.display = "block"
        }
      }}
    />
  )
}
