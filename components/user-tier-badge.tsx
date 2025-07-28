"use client"

import { Badge } from "@/components/ui/badge"
import { Crown, Shield, Star, Sprout } from "lucide-react"

interface UserTierBadgeProps {
  tier: string
  className?: string
  showIcon?: boolean
}

export function UserTierBadge({ tier, className = "", showIcon = true }: UserTierBadgeProps) {
  const getTierConfig = (tierValue: string) => {
    switch (tierValue?.toLowerCase()) {
      case "blood_brotherhood":
        return {
          label: "Blood Brotherhood",
          color: "bg-red-600 hover:bg-red-700 text-white",
          icon: Shield,
        }
      case "elder":
        return {
          label: "Elder",
          color: "bg-purple-600 hover:bg-purple-700 text-white",
          icon: Crown,
        }
      case "pioneer":
        return {
          label: "Pioneer",
          color: "bg-blue-600 hover:bg-blue-700 text-white",
          icon: Star,
        }
      case "grassroot":
        return {
          label: "Grassroot",
          color: "bg-green-600 hover:bg-green-700 text-white",
          icon: Sprout,
        }
      case "admin":
        return {
          label: "Admin",
          color: "bg-orange-600 hover:bg-orange-700 text-white",
          icon: Shield,
        }
      default:
        return {
          label: "Member",
          color: "bg-gray-600 hover:bg-gray-700 text-white",
          icon: Sprout,
        }
    }
  }

  const config = getTierConfig(tier)
  const Icon = config.icon

  return (
    <Badge className={`${config.color} ${className}`}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  )
}
