"use client"
import { useTheme } from "next-themes"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface DynamicLogoProps {
  className?: string
}

export function DynamicLogo({ className }: DynamicLogoProps) {
  const { theme, systemTheme } = useTheme()

  // Determine the current theme
  const currentTheme = theme === "system" ? systemTheme : theme

  return (
    <div className={cn("relative", className)}>
      <Image
        src={currentTheme === "dark" ? "/images/loggotrans-dark.png" : "/images/loggotrans-light.png"}
        alt="Erigga Live Logo"
        width={32}
        height={32}
        className="object-contain"
        priority
      />
    </div>
  )
}
