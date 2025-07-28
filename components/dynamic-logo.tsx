"use client"

import { useTheme } from "next-themes"
import Image from "next/image"
import { useEffect, useState } from "react"

interface DynamicLogoProps {
  className?: string
  width?: number
  height?: number
}

export function DynamicLogo({ className = "h-8 w-auto", width = 120, height = 32 }: DynamicLogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={`${className} bg-muted animate-pulse rounded`} />
  }

  const isDark = resolvedTheme === "dark"
  const logoSrc = isDark ? "/images/loggotrans-dark.png" : "/images/loggotrans-light.png"

  return (
    <Image
      src={logoSrc || "/placeholder.svg"}
      alt="Erigga"
      width={width}
      height={height}
      className={className}
      priority
      style={{
        objectFit: "contain",
      }}
    />
  )
}
