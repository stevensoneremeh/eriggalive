"use client"

import { Badge } from "@/components/ui/badge"
import { Crown, Star, Zap, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

type TierType = "general" | "grassroot" | "pioneer" | "elder" | "blood" | "blood_brotherhood" | string

interface UserTierBadgeProps {
  tier: TierType
  size?: "xs" | "sm" | "md" | "lg"
  showIcon?: boolean
  className?: string
}

const TIER_CONFIG = {
  general: {
    label: "General",
    color: "bg-gray-500 text-white",
    icon: Star,
  },
  grassroot: {
    label: "Grassroot",
    color: "bg-green-500 text-white",
    icon: Star,
  },
  pioneer: {
    label: "Pioneer",
    color: "bg-blue-500 text-white",
    icon: Zap,
  },
  elder: {
    label: "Elder",
    color: "bg-purple-500 text-white",
    icon: Crown,
  },
  blood: {
    label: "Blood",
    color: "bg-red-600 text-white",
    icon: Shield,
  },
  blood_brotherhood: {
    label: "Blood",
    color: "bg-red-600 text-white",
    icon: Shield,
  },
}

const SIZE_CONFIG = {
  xs: "text-xs px-1 py-0.5",
  sm: "text-xs px-2 py-1",
  md: "text-sm px-2 py-1",
  lg: "text-base px-3 py-1.5",
}

export function UserTierBadge({ tier, size = "sm", showIcon = true, className }: UserTierBadgeProps) {
  // Normalize tier value and provide fallback
  const normalizedTier = tier?.toLowerCase() || "general"
  const tierConfig = TIER_CONFIG[normalizedTier as keyof typeof TIER_CONFIG] || TIER_CONFIG.general
  const Icon = tierConfig.icon

  return (
    <Badge className={cn(tierConfig.color, SIZE_CONFIG[size], "font-medium inline-flex items-center gap-1", className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {tierConfig.label}
    </Badge>
  )
}
