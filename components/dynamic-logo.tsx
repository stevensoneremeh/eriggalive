"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useThemeContext } from "@/contexts/theme-context"

interface DynamicLogoProps {
  className?: string
}

export function DynamicLogo({ className = "h-8 w-8" }: DynamicLogoProps) {
  const { resolvedTheme, mounted } = useThemeContext()
  const [logoSrc, setLogoSrc] = useState("/placeholder-logo.svg")

  useEffect(() => {
    if (!mounted) return

    // Set logo based on theme
    if (resolvedTheme === "dark") {
      setLogoSrc("/images/loggotrans-dark.png")
    } else {
      setLogoSrc("/images/loggotrans-light.png")
    }
  }, [resolvedTheme, mounted])

  // Show placeholder until mounted
  if (!mounted) {
    return <div className={`${className} bg-muted rounded animate-pulse`} />
  }

  return (
    <Image
      src={logoSrc || "/placeholder.svg"}
      alt="Erigga Live Logo"
      width={32}
      height={32}
      className={className}
      priority
      onError={() => setLogoSrc("/placeholder-logo.svg")}
    />
  )
}
