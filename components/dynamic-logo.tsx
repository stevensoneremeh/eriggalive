"use client"

import { useTheme } from "next-themes"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface DynamicLogoProps {
  className?: string
}

export function DynamicLogo({ className }: DynamicLogoProps) {
  const { resolvedTheme } = useTheme()

  return (
    <div className={cn("relative", className)}>
      {resolvedTheme === "dark" ? (
        <Image
          src="/images/loggotrans-dark.png"
          alt="Erigga Live Logo"
          width={32}
          height={32}
          className="h-full w-full object-contain"
        />
      ) : (
        <Image
          src="/images/loggotrans-light.png"
          alt="Erigga Live Logo"
          width={32}
          height={32}
          className="h-full w-full object-contain"
        />
      )}
    </div>
  )
}
