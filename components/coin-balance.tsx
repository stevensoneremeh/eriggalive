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
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <div className={cn("flex items-center space-x-1 text-amber-600", sizeClasses[size], className)}>
      <Coins className={cn("text-amber-500", iconSizes[size])} />
      <span className="font-semibold">{coins.toLocaleString()}</span>
    </div>
  )
}
