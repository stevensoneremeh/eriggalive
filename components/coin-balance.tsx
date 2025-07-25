"use client"

import { useAuth } from "@/contexts/auth-context"
import { Coins } from "lucide-react"

interface CoinBalanceProps {
  size?: "sm" | "md" | "lg"
}

export function CoinBalance({ size = "md" }: CoinBalanceProps) {
  const { profile } = useAuth()

  const coins = profile?.coins || 0

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  return (
    <div className="flex items-center">
      <Coins className={`mr-1 ${size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6"} text-yellow-500`} />
      <span className={`font-medium ${sizeClasses[size]}`}>{coins.toLocaleString()} Coins</span>
    </div>
  )
}
