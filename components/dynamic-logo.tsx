"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface DynamicLogoProps {
  width?: number
  height?: number
  className?: string
}

export function DynamicLogo({ width = 140, height = 40, className = "" }: DynamicLogoProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return <div className={`bg-muted animate-pulse rounded ${className}`} style={{ width, height }} />
  }

  return (
    <div className={`relative ${className}`}>
      <Image
        src="/images/erigga-live-logo.png"
        alt="ERIGGA Live"
        width={width}
        height={height}
        className="object-contain w-auto h-auto max-w-full max-h-full"
        style={{
          width: "auto",
          height: "auto",
          maxWidth: `${width}px`,
          maxHeight: `${height}px`,
        }}
        priority
        sizes="(max-width: 640px) 100px, (max-width: 768px) 120px, 140px"
        onError={() => {
          console.warn("Logo image failed to load")
        }}
      />
    </div>
  )
}
