"use client"

import { useTheme } from "@/contexts/theme-context"
import Image from "next/image"
import { useEffect, useState } from "react"

interface DynamicLogoProps {
  className?: string
  width?: number
  height?: number
  priority?: boolean
}

export function DynamicLogo({ className = "", width = 120, height = 40, priority = false }: DynamicLogoProps) {
  const [mounted, setMounted] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<"dark" | "light">("dark")

  // Safely get theme context
  let theme: "dark" | "light" = "dark"
  let resolvedTheme: "dark" | "light" = "dark"

  // Initialize theme variables outside the try-catch block
  let themeContext: any = null

  try {
    themeContext = useTheme()
    theme = themeContext.theme === "system" ? themeContext.resolvedTheme : themeContext.theme
    resolvedTheme = themeContext.resolvedTheme
  } catch (error) {
    // Fallback to system theme detection if context is not available
    if (typeof window !== "undefined") {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
  }

  useEffect(() => {
    setMounted(true)
    setCurrentTheme(theme)
  }, [theme])

  // Show fallback during SSR and initial hydration to prevent layout shift
  if (!mounted) {
    return <div className={`font-street text-2xl text-gradient glow-text ${className}`}>ERIGGA</div>
  }

  const logoSrc = currentTheme === "dark" ? "/images/loggotrans-dark.png" : "/images/loggotrans-light.png"

  return (
    <div className={`relative ${className}`}>
      <Image
        src={logoSrc || "/placeholder.svg"}
        alt={`Erigga logo - ${currentTheme} theme`}
        width={width}
        height={height}
        priority={priority}
        className="object-contain transition-opacity duration-300 ease-in-out"
        style={{
          maxWidth: "100%",
          height: "auto",
        }}
        onError={(e) => {
          // Fallback to text logo if image fails to load
          const target = e.target as HTMLImageElement
          target.style.display = "none"
          const fallback = document.createElement("div")
          fallback.className = "font-street text-2xl text-gradient glow-text"
          fallback.textContent = "ERIGGA"
          target.parentNode?.appendChild(fallback)
        }}
      />
    </div>
  )
}
