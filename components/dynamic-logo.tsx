"use client"

import { useTheme } from "next-themes"
import Image from "next/image"
import { useEffect, useState } from "react"

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
    return <div className={`${className} bg-muted animate-pulse rounded`} />
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Image
      src={isDark ? "/images/loggotrans-dark.png" : "/images/loggotrans-light.png"}
      alt="Erigga Logo"
      width={120}
      height={40}
      className={className}
      priority
    />
  )
}
