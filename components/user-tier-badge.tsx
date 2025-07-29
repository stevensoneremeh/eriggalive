"use client"

import { Badge } from "@/components/ui/badge"
import { Crown } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserTierBadgeProps {
  tier: string
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
  className?: string
}

export function UserTierBadge({ tier, size = "md", showIcon = true, className }: UserTierBadgeProps) {
  const getTierConfig = (tierName: string) => {
    const normalizedTier = tierName?.toLowerCase() || "general"

    switch (normalizedTier) {
      case "blood":
      case "blood_brotherhood":
        return {
          label: "Blood",
          color: "bg-red-500 hover:bg-red-600 text-white border-red-500",
          textColor: "text-red-500",
        }
      case "elder":
        return {
          label: "Elder",
          color: "bg-purple-500 hover:bg-purple-600 text-white border-purple-500",
          textColor: "text-purple-500",
        }
      case "pioneer":
        return {
          label: "Pioneer",
          color: "bg-blue-500 hover:bg-blue-600 text-white border-blue-500",
          textColor: "text-blue-500",
        }
      case "grassroot":
        return {
          label: "Grassroot",
          color: "bg-green-500 hover:bg-green-600 text-white border-green-500",
          textColor: "text-green-500",
        }
      case "general":
      default:
        return {
          label: "General",
          color: "bg-gray-500 hover:bg-gray-600 text-white border-gray-500",
          textColor: "text-gray-500",
        }
    }
  }

  const config = getTierConfig(tier)

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
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
      variant="secondary"
      className={cn(config.color, sizeClasses[size], "font-medium inline-flex items-center gap-1", className)}
    >
      {showIcon && <Crown className={iconSizes[size]} />}
      {config.label}
    </Badge>
  )
}
