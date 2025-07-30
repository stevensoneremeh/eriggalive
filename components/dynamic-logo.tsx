"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import Image from "next/image"

interface DynamicLogoProps {
  className?: string
}

export function DynamicLogo({ className = "h-8 w-8" }: DynamicLogoProps) {
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className={`${className} bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center`}
      >
        <span className="text-white font-bold text-sm">EL</span>
      </div>
    )
  }

  // Use different logos based on theme
  const logoSrc = theme === "dark" ? "/images/loggotrans-dark.png" : "/images/loggotrans-light.png"

  return (
    <div className={className}>
      <Image
        src={logoSrc || "/placeholder.svg"}
        alt="Erigga Live"
        width={32}
        height={32}
        className="w-full h-full object-contain"
        onError={() => {
          // Fallback to text logo if image fails to load
          return (
            <div
              className={`${className} bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center`}
            >
              <span className="text-white font-bold text-sm">EL</span>
            </div>
          )
        }}
      />
    </div>
  )
}
