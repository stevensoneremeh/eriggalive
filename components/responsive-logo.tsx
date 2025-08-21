"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useTheme } from "@/contexts/theme-context"

interface ResponsiveLogoProps {
  className?: string
}

export function ResponsiveLogo({ className = "" }: ResponsiveLogoProps) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={`bg-muted animate-pulse rounded ${className}`} style={{ width: 180, height: 50 }} />
  }

  return (
    <picture className={className}>
      {/* Dark theme logo - for dark backgrounds */}
      <source media="(prefers-color-scheme: dark)" srcSet="/images/logo-dark.png 1x, /images/logo-dark@2x.png 2x" />
      {/* Light theme logo - for light backgrounds */}
      <Image
        src={resolvedTheme === "dark" ? "/images/logo-dark.png" : "/images/erigga-live-logo.png"}
        alt="ERIGGA Live - Official Fan Platform"
        width={180}
        height={50}
        className="object-contain w-auto h-auto max-w-full max-h-full 
                   sm:w-[120px] sm:h-[32px] 
                   md:w-[160px] md:h-[42px] 
                   lg:w-[200px] lg:h-[52px] 
                   xl:w-[240px] xl:h-[62px]"
        sizes="(max-width: 640px) 120px, (max-width: 768px) 160px, (max-width: 1024px) 200px, 240px"
        priority
        style={{
          filter: resolvedTheme === "dark" ? "none" : "contrast(1.1) brightness(1.05)",
        }}
      />
    </picture>
  )
}
