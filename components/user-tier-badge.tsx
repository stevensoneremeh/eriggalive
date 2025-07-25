"use client"

import { Badge } from "@/components/ui/badge"
import { Crown, Star, Shield, Zap } from "lucide-react"

interface UserTierBadgeProps {
  tier: string
  size?: "sm" | "md" | "lg"
}

const tierConfig = {
  grassroot: {
    label: "Grassroot",
    icon: Zap,
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  pioneer: {
    label: "Pioneer",
    icon: Star,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  elder: {
    label: "Elder",
    icon: Shield,
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
  blood_brotherhood: {
    label: "Blood Brotherhood",
    icon: Crown,
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  },
  admin: {
    label: "Admin",
    icon: Crown,
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  },
}

export function UserTierBadge({ tier, size = "sm" }: UserTierBadgeProps) {
  const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.grassroot
  const Icon = config.icon

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <Badge className={`${config.className} ${sizeClasses[size]} flex items-center gap-1`}>
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </Badge>
  )
}
