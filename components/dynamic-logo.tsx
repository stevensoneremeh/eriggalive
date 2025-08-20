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

    // Default responsive sizes - increased desktop size for better visual balance
    return {
      mobile: { width: 100, height: 28 },
      tablet: { width: 140, height: 38 },
      desktop: { width: 200, height: 55 }, // Increased from 180x50
      wide: { width: 220, height: 60 },
    }
  }

  const sizes = getResponsiveSizes()

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    const skeletonWidth = responsive ? 200 : width || 180
    const skeletonHeight = responsive ? 55 : height || 50
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
        width={responsive ? 220 : finalWidth} // Use largest size for intrinsic dimensions
        height={responsive ? 60 : finalHeight}
        className={
          responsive
            ? "object-contain w-auto h-auto max-w-full max-h-full sm:w-[100px] sm:h-[28px] md:w-[140px] md:h-[38px] lg:w-[200px] lg:h-[55px] xl:w-[220px] xl:h-[60px]"
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
            ? "(max-width: 640px) 100px, (max-width: 768px) 140px, (max-width: 1024px) 200px, 220px"
            : `${finalWidth}px`
        }
        onError={() => {
          console.warn("Logo image failed to load")
        }}
      />
    </div>
  )
}
