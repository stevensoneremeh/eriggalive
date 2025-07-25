"use client"

import { useTheme } from "next-themes"
import Image from "next/image"
import { useEffect, useState } from "react"

interface DynamicLogoProps {
  className?: string
  width?: number
  height?: number
}

export function DynamicLogo({ className = "h-10 md:h-12 lg:h-14 w-auto", width, height }: DynamicLogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={`${className} bg-gray-200 dark:bg-gray-800 rounded animate-pulse`} />
  }

  const isDark = resolvedTheme === "dark"
  const logoSrc = isDark ? "/images/loggotrans-dark.png" : "/images/loggotrans-light.png"

  return (
    <Image
      src={logoSrc || "/placeholder.svg"}
      alt="Erigga Live"
      width={width || 120}
      height={height || 40}
      className={className}
      priority
      style={{
        objectFit: "contain",
      }}
    />
  )
}
