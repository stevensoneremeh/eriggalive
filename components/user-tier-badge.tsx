<<<<<<< HEAD
import { Crown, Star, Shield, Droplet } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface UserTierBadgeProps {
  tier: string
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

export function UserTierBadge({ tier, size = "md", showLabel = true }: UserTierBadgeProps) {
  const tierInfo = {
    grassroot: {
      label: "Grassroot",
      icon: Star,
      color: "bg-gray-500/20 text-gray-500 border-gray-500",
      tooltip: "Grassroot tier member",
    },
    pioneer: {
      label: "Pioneer",
      icon: Crown,
      color: "bg-orange-500/20 text-orange-500 border-orange-500",
      tooltip: "Pioneer tier member with premium access",
    },
    elder: {
      label: "Elder",
      icon: Shield,
      color: "bg-gold-400/20 text-gold-400 border-gold-400",
      tooltip: "Elder tier member with enhanced premium access",
    },
    blood: {
      label: "Blood",
      icon: Droplet,
      color: "bg-red-500/20 text-red-500 border-red-500",
      tooltip: "Blood tier member with exclusive access",
    },
  }

  const tierData = tierInfo[tier as keyof typeof tierInfo] || tierInfo.grassroot

  const IconComponent = tierData.icon

  const sizeClasses = {
    sm: "text-xs py-0.5 px-1.5",
    md: "text-sm py-1 px-2",
    lg: "text-base py-1.5 px-3",
  }

  const iconSizes = {
=======
"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getTierDisplayInfo } from "@/hooks/useMembership"
import { cn } from "@/lib/utils"

interface UserTierBadgeProps {
  tier: string
  size?: "sm" | "md" | "lg" | "xs" | "xxs"
  showLabel?: boolean
  className?: string
}

export function UserTierBadge({ tier, size = "md", showLabel = true, className = "" }: UserTierBadgeProps) {
  const tierInfo = getTierDisplayInfo(tier)

  const getBadgeClasses = (color: string) => {
    switch (color) {
      case "green":
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
      case "blue":
        return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
      case "yellow":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800"
    }
  }

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
>>>>>>> new
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

<<<<<<< HEAD
=======
  const IconComponent = tierInfo.icon

>>>>>>> new
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
<<<<<<< HEAD
          <Badge variant="outline" className={`${tierData.color} ${sizeClasses[size]} font-medium`}>
            <IconComponent className={`${iconSizes[size]} ${showLabel ? "mr-1" : ""}`} />
            {showLabel && tierData.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tierData.tooltip}</p>
=======
          <Badge
            variant="outline"
            className={cn(
              getBadgeClasses(tierInfo.color),
              sizeClasses[size],
              "font-medium transition-all duration-300 inline-flex items-center gap-1",
              className,
            )}
          >
            <IconComponent className={cn(iconSizes[size], "shrink-0")} />
            {showLabel && <span className="truncate">{tierInfo.label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tierInfo.tooltip}</p>
>>>>>>> new
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
<<<<<<< HEAD
=======

export default UserTierBadge
>>>>>>> new
