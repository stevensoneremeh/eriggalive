"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface DynamicLogoProps {
  width?: number
  height?: number
  className?: string
  responsive?: boolean
}

export function DynamicLogo({ width = 180, height = 50, className = "", responsive = true }: DynamicLogoProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return <div className={`bg-muted animate-pulse rounded ${className}`} style={{ width, height }} />
  }

  const responsiveClasses = responsive
    ? "w-24 h-7 sm:w-28 sm:h-8 md:w-32 md:h-9 lg:w-40 lg:h-11 xl:w-48 xl:h-13 2xl:w-52 2xl:h-14"
    : ""

  return (
    <div className={`relative ${responsiveClasses} ${className}`}>
      <Image
        src="/images/erigga-live-logo.png"
        alt="ERIGGA Live"
        width={responsive ? 208 : width} // Increased max width for better desktop display
        height={responsive ? 56 : height} // Proportional height increase
        className="object-contain w-full h-full"
        style={
          !responsive
            ? {
                width: "auto",
                height: "auto",
                maxWidth: `${width}px`,
                maxHeight: `${height}px`,
              }
            : undefined
        }
        priority
        sizes={
          responsive
            ? "(max-width: 640px) 96px, (max-width: 768px) 112px, (max-width: 1024px) 128px, (max-width: 1280px) 160px, (max-width: 1536px) 192px, 208px"
            : `${width}px`
        }
        onError={() => {
          console.warn("Logo image failed to load")
        }}
      />
    </div>
  )
}
