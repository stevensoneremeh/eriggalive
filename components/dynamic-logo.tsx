"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface DynamicLogoProps {
  width?: number
  height?: number
  className?: string
  responsive?: boolean
}

export function DynamicLogo({ width, height, className = "", responsive = true }: DynamicLogoProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getResponsiveSizes = () => {
    if (!responsive && width && height) {
      return { width, height }
    }

    return {
      mobile: { width: 120, height: 32 }, // Increased from 100x28
      tablet: { width: 160, height: 44 }, // Increased from 140x38
      desktop: { width: 240, height: 66 }, // Increased from 200x55
      wide: { width: 280, height: 76 }, // Increased from 220x60
    }
  }

  const sizes = getResponsiveSizes()

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    const skeletonWidth = responsive ? 240 : width || 180
    const skeletonHeight = responsive ? 66 : height || 50
    return (
      <div
        className={`bg-muted animate-pulse rounded ${className}`}
        style={{ width: skeletonWidth, height: skeletonHeight }}
      />
    )
  }

  const finalWidth = responsive ? undefined : width || 180
  const finalHeight = responsive ? undefined : height || 50

  return (
    <div className={`relative ${className}`}>
      <Image
        src="/images/erigga-live-logo.png"
        alt="ERIGGA Live"
        width={responsive ? 280 : finalWidth}
        height={responsive ? 76 : finalHeight}
        className={
          responsive
            ? "object-contain w-auto h-auto max-w-full max-h-full sm:w-[120px] sm:h-[32px] md:w-[160px] md:h-[44px] lg:w-[240px] lg:h-[66px] xl:w-[280px] xl:h-[76px]"
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
            ? "(max-width: 640px) 120px, (max-width: 768px) 160px, (max-width: 1024px) 240px, 280px"
            : `${finalWidth}px`
        }
        onError={() => {
          console.warn("Logo image failed to load")
        }}
      />
    </div>
  )
}
