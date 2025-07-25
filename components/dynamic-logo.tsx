"use client"

import { useTheme } from "next-themes"
import Image from "next/image"
import { useEffect, useState } from "react"

interface DynamicLogoProps {
  className?: string
}

export function DynamicLogo({ className = "h-10 md:h-12 lg:h-14 w-auto" }: DynamicLogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={`${className} bg-gray-200 dark:bg-gray-700 rounded animate-pulse`} />
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Image
      src={isDark ? "/images/loggotrans-dark.png" : "/images/loggotrans-light.png"}
      alt="Erigga Live"
      width={120}
      height={48}
      className={className}
      priority
    />
  )
}
