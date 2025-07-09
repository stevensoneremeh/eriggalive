"use client"

import { Coins } from "lucide-react"
import { cn } from "@/lib/utils"

interface CoinBalanceProps {
  coins: number
  size?: "sm" | "md" | "lg"
  className?: string
}

export function CoinBalance({ coins, size = "md", className }: CoinBalanceProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  return (
    <div className={cn("flex items-center space-x-1 text-orange-500", sizeClasses[size], className)}>
      <Coins className={iconSizes[size]} />
      <span className="font-medium">{coins.toLocaleString()}</span>
    </div>
  )
}
