"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Crown, Users, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserTierBadgeProps {
  tier: string
  size?: "sm" | "md" | "lg" | "xs" | "xxs"
  showLabel?: boolean
  className?: string
}

function getTierDisplayInfo(tier: string) {
  const normalizedTier = tier?.toLowerCase() || "erigga_citizen"

  switch (normalizedTier) {
    case "erigga_citizen":
    case "citizen":
    case "free":
      return {
        label: "Erigga Citizen",
        shortLabel: "Citizen",
        color: "green",
        icon: Users,
        tooltip: "Erigga Citizen - Community Member",
        badgeClasses:
          "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      }
    case "erigga_indigen":
    case "indigen":
    case "pro":
      return {
        label: "Erigga Indigen",
        shortLabel: "Indigen",
        color: "blue",
        icon: Star,
        tooltip: "Erigga Indigen - Premium Member",
        badgeClasses:
          "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
      }
    case "enterprise":
    case "ent":
      return {
        label: "Enterprise",
        shortLabel: "Enterprise",
        color: "yellow",
        icon: Crown,
        tooltip: "Enterprise - VIP Member",
        badgeClasses:
          "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
      }
    default:
      return {
        label: "Erigga Citizen",
        shortLabel: "Citizen",
        color: "green",
        icon: Users,
        tooltip: "Erigga Citizen - Community Member",
        badgeClasses:
          "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      }
  }
}

export function UserTierBadge({ tier, size = "md", showLabel = true, className = "" }: UserTierBadgeProps) {
  const tierInfo = getTierDisplayInfo(tier)

  const sizeClasses = {
    xxs: "text-[10px] py-0 px-1 h-4",
    xs: "text-xs py-0.5 px-1.5 h-5",
    sm: "text-xs py-0.5 px-2 h-6",
    md: "text-sm py-1 px-3 h-7",
    lg: "text-base py-1.5 px-4 h-8",
  }

  const iconSizes = {
    xxs: "h-2 w-2",
    xs: "h-2.5 w-2.5",
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  const IconComponent = tierInfo.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              tierInfo.badgeClasses,
              sizeClasses[size],
              "font-medium transition-all duration-300 inline-flex items-center gap-1",
              className,
            )}
          >
            <IconComponent className={cn(iconSizes[size], "shrink-0")} />
            {showLabel && (
              <span className="truncate">{size === "xxs" || size === "xs" ? tierInfo.shortLabel : tierInfo.label}</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tierInfo.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default UserTierBadge
