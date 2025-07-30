"use client"

import { useThemeContext } from "@/contexts/theme-context"

interface DynamicLogoProps {
  className?: string
}

export function DynamicLogo({ className = "h-8 w-8" }: DynamicLogoProps) {
  const { theme, mounted } = useThemeContext()

  if (!mounted) {
    return <div className={`${className} bg-gradient-to-r from-purple-500 to-pink-500 rounded-full`} />
  }

  return (
    <div
      className={`${className} bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center`}
    >
      <span className="text-white font-bold text-sm">E</span>
    </div>
  )
}
