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
      ? "/images/logo-dark.png" // Dark background logo for dark theme
      : "/images/erigga-live-logo.png" // Light logo for light theme

  return (
    <div className={`relative ${className}`}>
      <Image
        src={logoSrc || "/placeholder.svg"}
        alt="ERIGGA Live"
        width={responsive ? 260 : finalWidth}
        height={responsive ? 68 : finalHeight}
        className={
          responsive
            ? "object-contain w-auto h-auto max-w-full max-h-full sm:w-[120px] sm:h-[32px] md:w-[160px] md:h-[42px] lg:w-[220px] lg:h-[58px] xl:w-[260px] xl:h-[68px]"
            : "object-contain w-auto h-auto max-w-full max-h-full"
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
            ? "(max-width: 640px) 120px, (max-width: 768px) 160px, (max-width: 1024px) 220px, 260px"
            : `${finalWidth}px`
        }
        onError={() => {
          console.warn("Logo image failed to load")
        }}
      />
    </div>
  )
}
