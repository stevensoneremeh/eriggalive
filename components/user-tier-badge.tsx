import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getTierDisplayInfo } from "@/hooks/useMembership"

interface UserTierBadgeProps {
  tier: string
  size?: "sm" | "md" | "lg" | "xs" | "xxs"
  showLabel?: boolean
  className?: string
}

export function UserTierBadge({ tier, size = "md", showLabel = true, className = "" }: UserTierBadgeProps) {
  const tierInfo = getTierDisplayInfo(tier)

  const getBadgeVariant = (color: string) => {
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
    xxs: "text-xs py-0 px-1",
    xs: "text-xs py-0.5 px-1",
    sm: "text-xs py-0.5 px-1.5",
    md: "text-sm py-1 px-2",
    lg: "text-base py-1.5 px-3",
  }

  const iconSizes = {
    xxs: "h-2.5 w-2.5",
    xs: "h-3 w-3",
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  const isEnterprise = tier === "enterprise" || tier === "ent" || tier === "blood" || tier === "blood_brotherhood"

  const enterpriseClasses = isEnterprise
    ? "bg-gradient-to-r from-yellow-400/30 to-amber-500/30 text-yellow-600 border-yellow-500 shadow-lg shadow-yellow-400/25 hover:shadow-yellow-400/40 hover:from-yellow-400/40 hover:to-amber-500/40 font-bold"
    : ""

  const enterpriseTextStyle = isEnterprise && tierInfo.label === "E" ? "font-black text-xl tracking-wider" : ""

  const IconComponent = tierInfo.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${getBadgeVariant(tierInfo.color)} ${className} ${sizeClasses[size]} font-medium transition-all duration-300 ${isEnterprise ? "animate-pulse" : ""}`}
          >
            <IconComponent className={`${iconSizes[size]} ${showLabel ? "mr-1" : ""}`} />
            {showLabel && <span className={enterpriseTextStyle}>{tierInfo.label}</span>}
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
