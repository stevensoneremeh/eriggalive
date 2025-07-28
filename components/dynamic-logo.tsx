"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import Image from "next/image"

interface DynamicLogoProps {
  className?: string
}

export function DynamicLogo({ className = "h-8 w-auto" }: DynamicLogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={`${className} bg-slate-200 dark:bg-slate-700 animate-pulse rounded`} />
  }

  const isDark = resolvedTheme === "dark"
  const logoSrc = isDark ? "/images/loggotrans-dark.png" : "/images/loggotrans-light.png"

  return (
    <Image
      src={logoSrc || "/placeholder.svg"}
      alt="Erigga"
      width={120}
      height={40}
      className={className}
      priority
      onError={(e) => {
        // Fallback to placeholder if logo fails to load
        const target = e.target as HTMLImageElement
        target.src = "/placeholder-logo.svg"
      }}
    />
  )
}
