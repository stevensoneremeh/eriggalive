"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface DynamicLogoProps {
  width?: number
  height?: number
  className?: string
}

export function DynamicLogo({ width = 120, height = 32, className = "" }: DynamicLogoProps) {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Check initial theme
    const checkTheme = () => {
      const isDarkMode =
        document.documentElement.classList.contains("dark") ||
        (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
      setIsDark(isDarkMode)
    }

    checkTheme()

    // Listen for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      if (
        !document.documentElement.classList.contains("light") &&
        !document.documentElement.classList.contains("dark")
      ) {
        checkTheme()
      }
    }

    mediaQuery.addEventListener("change", handleChange)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [])

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return <div className={`bg-muted animate-pulse rounded ${className}`} style={{ width, height }} />
  }

  const logoSrc = isDark ? "/images/loggotrans-light.png" : "/images/loggotrans-dark.png"

  return (
    <Image
      src={logoSrc || "/placeholder.svg"}
      alt="Erigga Live Logo"
      width={width}
      height={height}
      className={className}
      priority
      onError={() => {
        // Fallback to a simple text logo if images fail
        console.warn("Logo image failed to load")
      }}
    />
  )
}
