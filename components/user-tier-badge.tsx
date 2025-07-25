"use client"

import { Badge } from "@/components/ui/badge"
import { Crown, Star, Zap, Flame } from "lucide-react"

interface UserTierBadgeProps {
  tier: string
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
}

export function UserTierBadge({ tier, size = "md", showIcon = true }: UserTierBadgeProps) {
  const getTierConfig = (tierName: string) => {
    const normalizedTier = tierName?.toLowerCase().replace(/[_\s]/g, "")

    switch (normalizedTier) {
      case "admin":
        return {
          label: "Admin",
          color: "bg-red-500 text-white",
          icon: Crown,
        }
      case "bloodbrotherhood":
        return {
          label: "Blood Brotherhood",
          color: "bg-red-600 text-white",
          icon: Flame,
        }
      case "elder":
        return {
          label: "Elder",
          color: "bg-purple-500 text-white",
          icon: Crown,
        }
      case "pioneer":
        return {
          label: "Pioneer",
          color: "bg-blue-500 text-white",
          icon: Zap,
        }
      case "grassroot":
      default:
        return {
          label: "Grassroot",
          color: "bg-green-500 text-white",
          icon: Star,
        }
    }
  }

  const config = getTierConfig(tier)
  const Icon = config.icon

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
    <Badge className={`${config.color} ${sizeClasses[size]} font-medium`}>
      {showIcon && <Icon className={`${iconSizes[size]} mr-1`} />}
      {config.label}
    </Badge>
  )
}
