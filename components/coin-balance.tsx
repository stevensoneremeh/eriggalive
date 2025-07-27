"use client"

import { Coins } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"

export function CoinBalance() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <Badge variant="secondary" className="flex items-center space-x-1">
        <Coins className="h-3 w-3" />
        <span>...</span>
      </Badge>
    )
  }

  const balance = profile?.coins_balance || 0

  return (
    <Badge variant="secondary" className="flex items-center space-x-1">
      <Coins className="h-3 w-3 text-yellow-500" />
      <span>{balance.toLocaleString()}</span>
    </Badge>
  )
}
