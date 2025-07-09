"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface UserTierBadgeProps {
  tier: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function UserTierBadge({ tier, size = "md", className }: UserTierBadgeProps) {
  const getTierColor = (tierName: string) => {
    switch (tierName?.toLowerCase()) {
      case "grassroot":
        return "bg-green-500 hover:bg-green-600"
      case "pioneer":
        return "bg-blue-500 hover:bg-blue-600"
      case "elder":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "blood":
        return "bg-red-500 hover:bg-red-600"
      case "admin":
        return "bg-purple-500 hover:bg-purple-600"
      case "mod":
        return "bg-indigo-500 hover:bg-indigo-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1",
  }

  return (
    <Badge className={cn("text-white font-medium", getTierColor(tier), sizeClasses[size], className)}>
      {tier?.charAt(0).toUpperCase() + tier?.slice(1) || "Grassroot"}
    </Badge>
  )
}
