"use client"

import { Badge } from "@/components/ui/badge"
import { Crown, Star, Zap, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserTierBadgeProps {
  tier: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function UserTierBadge({ tier, size = "md", className }: UserTierBadgeProps) {
  const getTierConfig = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "blood":
        return {
          label: "Blood",
          icon: Flame,
          className: "bg-red-600 text-white hover:bg-red-700",
        }
      case "elder":
        return {
          label: "Elder",
          icon: Crown,
          className: "bg-purple-600 text-white hover:bg-purple-700",
        }
      case "pioneer":
        return {
          label: "Pioneer",
          icon: Star,
          className: "bg-blue-600 text-white hover:bg-blue-700",
        }
      case "grassroot":
      default:
        return {
          label: "Grassroot",
          icon: Zap,
          className: "bg-green-600 text-white hover:bg-green-700",
        }
    }
  }

  const config = getTierConfig(tier)
  const Icon = config.icon

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-sm px-3 py-1.5",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  }

  return (
    <Badge className={cn(config.className, sizeClasses[size], "flex items-center space-x-1", className)}>
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </Badge>
  )
}
