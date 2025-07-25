"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import Image from "next/image"

interface DynamicLogoProps {
  className?: string
}

export function DynamicLogo({ className = "h-10 w-auto" }: DynamicLogoProps) {
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
      alt="Erigga Live"
      width={200}
      height={80}
      className={className}
      priority
      style={{ objectFit: "contain" }}
    />
  )
}
