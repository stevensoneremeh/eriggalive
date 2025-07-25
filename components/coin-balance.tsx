"use client"

import { Coins } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CoinBalanceProps {
  balance: number
}

export function CoinBalance({ balance }: CoinBalanceProps) {
  return (
    <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
      <Coins className="h-3 w-3" />
      <span className="font-medium">{balance.toLocaleString()}</span>
    </Badge>
  )
}
