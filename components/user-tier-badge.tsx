"use client"

import { Badge } from "@/components/ui/badge"
import { Crown, Star, Gem, Shield } from "lucide-react"

interface UserTierBadgeProps {
  tier: string
  className?: string
}

export function UserTierBadge({ tier, className }: UserTierBadgeProps) {
  const getTierConfig = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "premium":
        return {
          icon: Crown,
          label: "Premium",
          variant: "default" as const,
          className: "bg-yellow-500 text-yellow-50 hover:bg-yellow-600",
        }
      case "vip":
        return {
          icon: Gem,
          label: "VIP",
          variant: "default" as const,
          className: "bg-purple-500 text-purple-50 hover:bg-purple-600",
        }
      case "legend":
        return {
          icon: Shield,
          label: "Legend",
          variant: "default" as const,
          className: "bg-red-500 text-red-50 hover:bg-red-600",
        }
      default:
        return {
          icon: Star,
          label: "Free",
          variant: "secondary" as const,
          className: "",
        }
    }
  }

  const config = getTierConfig(tier)
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={`flex items-center space-x-1 ${config.className} ${className}`}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  )
}
