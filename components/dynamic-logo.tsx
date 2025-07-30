"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useTheme } from "@/contexts/theme-context"

export function DynamicLogo() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-muted rounded" />
        <span className="text-xl font-bold">Erigga Live</span>
      </div>
    )
  }

  const logoSrc = theme === "dark" ? "/images/loggotrans-dark.png" : "/images/loggotrans-light.png"

  return (
    <div className="flex items-center space-x-2">
      <Image
        src={logoSrc || "/placeholder.svg"}
        alt="Erigga Live"
        width={32}
        height={32}
        className="w-8 h-8"
        priority
      />
      <span className="text-xl font-bold">Erigga Live</span>
    </div>
  )
}
