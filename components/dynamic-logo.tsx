"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useTheme } from "@/contexts/theme-context"

export function DynamicLogo() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show a placeholder until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded bg-muted animate-pulse" />
        <span className="hidden font-bold sm:inline-block">Erigga Live</span>
      </div>
    )
  }

  const logoSrc = resolvedTheme === "dark" ? "/images/loggotrans-dark.png" : "/images/loggotrans-light.png"

  return (
    <div className="flex items-center space-x-2">
      <Image
        src={logoSrc || "/placeholder.svg"}
        alt="Erigga Live"
        width={32}
        height={32}
        className="h-8 w-8"
        priority
      />
      <span className="hidden font-bold sm:inline-block">Erigga Live</span>
    </div>
  )
}
