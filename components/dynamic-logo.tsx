"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"

interface DynamicLogoProps {
  width?: number
  height?: number
  className?: string
  responsive?: boolean
}

export function DynamicLogo({ width, height, className = "", responsive = true }: DynamicLogoProps) {
  const [mounted, setMounted] = useState(false)
  const { theme, resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const getResponsiveSizes = () => {
    if (!responsive && width && height) {
      return { width, height }
    }

    return {
      mobile: { width: 120, height: 32 },
      tablet: { width: 160, height: 42 },
      desktop: { width: 220, height: 58 },
      wide: { width: 260, height: 68 },
    }
  }

  const sizes = getResponsiveSizes()

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    const skeletonWidth = responsive ? 220 : width || 180
    const skeletonHeight = responsive ? 58 : height || 50
    return (
      <div
        className={`bg-muted animate-pulse rounded ${className}`}
        style={{ width: skeletonWidth, height: skeletonHeight }}
      />
    )
  }

  const finalWidth = responsive ? undefined : width || 180
  const finalHeight = responsive ? undefined : height || 50

  const currentTheme = resolvedTheme || theme

  const logoSrc =
    currentTheme === "dark"
      ? "/images/erigga-live-logo-dark.png" // User's exact uploaded logo with red ERIGGA and white Live text
      : "/images/erigga-live-logo.png" // Light theme logo

  console.log("[v0] Current theme:", currentTheme, "Logo src:", logoSrc) // Debug theme switching

  return (
    <div className={`relative ${className}`}>
      <Image
        src={logoSrc || "/placeholder.svg"}
        alt="ERIGGA Live"
        width={responsive ? 260 : finalWidth}
        height={responsive ? 68 : finalHeight}
        className={
          responsive
            ? // Enhanced responsive classes for better logo scaling across all devices
              "object-contain w-auto h-auto max-w-full max-h-full transition-all duration-200 sm:w-[120px] sm:h-[32px] md:w-[160px] md:h-[42px] lg:w-[220px] lg:h-[58px] xl:w-[260px] xl:h-[68px] 2xl:w-[280px] 2xl:h-[72px]"
            : "object-contain w-auto h-auto max-w-full max-h-full transition-all duration-200"
        }
        style={
          responsive
            ? undefined
            : {
                width: "auto",
                height: "auto",
                maxWidth: `${finalWidth}px`,
                maxHeight: `${finalHeight}px`,
              }
        }
        priority
        sizes={
          responsive
            ? // Updated sizes for better responsive image loading
              "(max-width: 640px) 120px, (max-width: 768px) 160px, (max-width: 1024px) 220px, (max-width: 1536px) 260px, 280px"
            : `${finalWidth}px`
        }
        onError={() => {
          console.warn("[v0] Logo image failed to load:", logoSrc)
        }}
        onLoad={() => {
          console.log("[v0] Logo loaded successfully:", logoSrc)
        }}
      />
    </div>
  )
}
