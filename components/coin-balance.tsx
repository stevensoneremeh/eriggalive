"use client"

import { useState, useEffect } from "react"
import { Coins } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"

interface CoinBalanceProps {
  coins?: number
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
}

export function CoinBalance({ coins, size = "md", showIcon = true }: CoinBalanceProps) {
  const { profile } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Badge variant="secondary" className="animate-pulse">
        <div className="w-12 h-4 bg-muted rounded" />
      </Badge>
    )
  }

  const coinCount = coins ?? profile?.coins ?? 0

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <Badge
      variant="secondary"
      className={`${sizeClasses[size]} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 font-medium`}
    >
      {showIcon && <Coins className={`${iconSizes[size]} mr-1`} />}
      {coinCount.toLocaleString()}
    </Badge>
  )
}
