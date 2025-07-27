"use client"

import { Badge } from "@/components/ui/badge"
import { Crown, Star, Zap, Shield, Gem } from "lucide-react"
import { cn } from "@/lib/utils"

type TierType =
  | "general"
  | "grassroot"
  | "pioneer"
  | "elder"
  | "blood"
  | "blood_brotherhood"
  | "standard"
  | null
  | undefined

interface UserTierBadgeProps {
  tier: TierType
  size?: "xs" | "sm" | "md" | "lg"
  showIcon?: boolean
  className?: string
}

const getTierConfig = (tier: TierType) => {
  // Normalize tier value and handle null/undefined
  const normalizedTier = tier?.toString().toLowerCase().replace("_", "") || "general"

  switch (normalizedTier) {
    case "blood":
    case "bloodbrotherhood":
      return {
        label: "Blood",
        color: "bg-gradient-to-r from-red-600 to-red-800 text-white",
        icon: Gem,
        description: "Elite Member",
      }
    case "elder":
      return {
        label: "Elder",
        color: "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
        icon: Crown,
        description: "VIP Member",
      }
    case "pioneer":
      return {
        label: "Pioneer",
        color: "bg-gradient-to-r from-blue-600 to-cyan-600 text-white",
        icon: Zap,
        description: "Premium Member",
      }
    case "grassroot":
      return {
        label: "Grassroot",
        color: "bg-gradient-to-r from-green-600 to-emerald-600 text-white",
        icon: Star,
        description: "Active Member",
      }
    case "standard":
      return {
        label: "Standard",
        color: "bg-gradient-to-r from-gray-600 to-gray-700 text-white",
        icon: Shield,
        description: "Member",
      }
    case "general":
    default:
      return {
        label: "General",
        color: "bg-gradient-to-r from-gray-500 to-gray-600 text-white",
        icon: Star,
        description: "Community Member",
      }
  }
}

const getSizeClasses = (size: "xs" | "sm" | "md" | "lg") => {
  switch (size) {
    case "xs":
      return {
        badge: "px-1.5 py-0.5 text-xs",
        icon: "h-2.5 w-2.5",
      }
    case "sm":
      return {
        badge: "px-2 py-1 text-xs",
        icon: "h-3 w-3",
      }
    case "lg":
      return {
        badge: "px-4 py-2 text-base",
        icon: "h-5 w-5",
      }
    case "md":
    default:
      return {
        badge: "px-3 py-1.5 text-sm",
        icon: "h-4 w-4",
      }
  }
}

export function UserTierBadge({ tier, size = "md", showIcon = true, className }: UserTierBadgeProps) {
  const config = getTierConfig(tier)
  const sizeClasses = getSizeClasses(size)
  const Icon = config.icon

  return (
    <Badge
      className={cn(config.color, sizeClasses.badge, "font-semibold border-0 shadow-sm", className)}
      title={config.description}
    >
      {showIcon && <Icon className={cn(sizeClasses.icon, "mr-1")} />}
      {config.label}
    </Badge>
  )
}
