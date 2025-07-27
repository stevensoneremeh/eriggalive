"use client"

import { Badge } from "@/components/ui/badge"
import { Crown, Gem, Shield, Users, Zap } from "lucide-react"

interface UserTierBadgeProps {
  tier?: string | null
  className?: string
  size?: "sm" | "md" | "lg"
}

export function UserTierBadge({ tier, className, size = "md" }: UserTierBadgeProps) {
  const getTierConfig = (tierValue?: string | null) => {
    const normalizedTier = tierValue?.toLowerCase() || "general"

    switch (normalizedTier) {
      case "blood":
      case "blood_brotherhood":
        return {
          icon: Crown,
          label: "Blood",
          variant: "default" as const,
          className: "bg-red-500 text-red-50 hover:bg-red-600",
        }
      case "elder":
        return {
          icon: Shield,
          label: "Elder",
          variant: "default" as const,
          className: "bg-purple-500 text-purple-50 hover:bg-purple-600",
        }
      case "pioneer":
        return {
          icon: Gem,
          label: "Pioneer",
          variant: "default" as const,
          className: "bg-blue-500 text-blue-50 hover:bg-blue-600",
        }
      case "grassroot":
        return {
          icon: Zap,
          label: "Grassroot",
          variant: "default" as const,
          className: "bg-green-500 text-green-50 hover:bg-green-600",
        }
      case "general":
      default:
        return {
          icon: Users,
          label: "General",
          variant: "secondary" as const,
          className: "bg-gray-500 text-gray-50 hover:bg-gray-600",
        }
    }
  }

  const config = getTierConfig(tier)
  const Icon = config.icon

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <Badge
      variant={config.variant}
      className={`flex items-center space-x-1 ${config.className} ${sizeClasses[size]} ${className || ""}`}
    >
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </Badge>
  )
}
