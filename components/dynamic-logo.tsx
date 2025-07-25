"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import Image from "next/image"

export function DynamicLogo() {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-8 w-32 bg-muted animate-pulse rounded" />
  }

  const currentTheme = resolvedTheme || theme
  const logoSrc = currentTheme === "dark" ? "/images/loggotrans-dark.png" : "/images/loggotrans-light.png"

  return (
    <Image
      src={logoSrc || "/placeholder.svg"}
      alt="Erigga Live"
      width={128}
      height={32}
      className="h-8 w-auto"
      priority
    />
  )
}
