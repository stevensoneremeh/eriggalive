"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import Image from "next/image"

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
    // Return a simple fallback during SSR
    return (
      <div
        className={`${className} bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center`}
      >
        <span className="text-white font-bold text-sm">E</span>
      </div>
    )
  }

  const currentTheme = resolvedTheme || theme

  return (
    <div className={`${className} relative`}>
      {currentTheme === "dark" ? (
        <Image
          src="/images/loggotrans-dark.png"
          alt="Erigga Live"
          width={32}
          height={32}
          className="object-contain"
          onError={() => {
            // Fallback if image fails to load
            return (
              <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
            )
          }}
        />
      ) : (
        <Image
          src="/images/loggotrans-light.png"
          alt="Erigga Live"
          width={32}
          height={32}
          className="object-contain"
          onError={() => {
            // Fallback if image fails to load
            return (
              <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
            )
          }}
        />
      )}
    </div>
  )
}
