"use client"

import { useTheme } from "next-themes"
import Image from "next/image"
import { useEffect, useState } from "react"

interface DynamicLogoProps {
  className?: string
  width?: number
  height?: number
}

export function DynamicLogo({ className = "h-12 md:h-14 lg:h-16 w-auto", width, height }: DynamicLogoProps) {
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
      width={width || 140}
      height={height || 48}
      className={className}
      priority
      style={{
        objectFit: "contain",
      }}
    />
  )
}
