import { Crown, Users, Building } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getBadgeConfig } from "@/lib/membership"
import type { MembershipTierCode } from "@/lib/membership"

interface MembershipBadgeProps {
  tierCode: MembershipTierCode
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  variant?: "default" | "outline" | "secondary"
}

export function MembershipBadge({
  tierCode,
  size = "md",
  showLabel = true,
  variant = "outline",
}: MembershipBadgeProps) {
  const badgeConfig = getBadgeConfig(tierCode)

  const tierInfo = {
    FREE: {
      label: "ECor Erigga Citizen",
      icon: Users,
      tooltip: "ECor Erigga Citizen - Basic community member with access to core features",
    },
    PRO: {
      label: "Erigga Indigen",
      icon: Crown,
      tooltip: "Erigga Indigen - Pro member with premium content access and coin rewards",
    },
    ENT: {
      label: "E",
      icon: Building,
      tooltip: "Enterprise member with exclusive VIP access and custom dashboard",
    },
  }

  const tierData = tierInfo[tierCode]
  const IconComponent = tierData.icon

  const sizeClasses = {
    sm: "text-xs py-0.5 px-1.5",
    md: "text-sm py-1 px-2",
    lg: "text-base py-1.5 px-3",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  const colorClasses = {
    FREE: "bg-gray-500/20 text-gray-700 border-gray-300",
    PRO: "bg-blue-500/20 text-blue-700 border-blue-300",
    ENT: "bg-yellow-500/20 text-yellow-800 border-yellow-400",
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className={`${colorClasses[tierCode]} ${sizeClasses[size]} font-medium`}>
            <IconComponent className={`${iconSizes[size]} ${showLabel ? "mr-1" : ""}`} />
            {showLabel && tierData.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tierData.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
