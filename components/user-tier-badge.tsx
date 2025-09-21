import { User, Building, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface UserTierBadgeProps {
  tier: string
  size?: "sm" | "md" | "lg" | "xs" | "xxs"
  showLabel?: boolean
}

export function UserTierBadge({ tier, size = "md", showLabel = true }: UserTierBadgeProps) {
  const tierInfo = {
    // Legacy grassroot system (keeping for backward compatibility)
    grassroot: {
      label: "Erigga Citizen",
      icon: User,
      color: "bg-green-500/20 text-green-600 border-green-500",
      tooltip: "Free tier member - Erigga Citizen",
    },
    // New tier system
    erigga_citizen: {
      label: "Erigga Citizen",
      icon: User,
      color: "bg-green-500/20 text-green-600 border-green-500",
      tooltip: "Free tier member - Erigga Citizen",
    },
    pioneer: {
      label: "Erigga Indigen",
      icon: Star,
      color: "bg-blue-500/20 text-blue-600 border-blue-500",
      tooltip: "Pro tier member - Erigga Indigen with premium access",
    },
    erigga_indigen: {
      label: "Erigga Indigen",
      icon: Star,
      color: "bg-blue-500/20 text-blue-600 border-blue-500",
      tooltip: "Pro tier member - Erigga Indigen with premium access",
    },
    elder: {
      label: "Erigga Indigen",
      icon: Star,
      color: "bg-blue-500/20 text-blue-600 border-blue-500",
      tooltip: "Pro tier member - Erigga Indigen with premium access",
    },
    blood: {
      label: "E",
      icon: Building,
      color: "bg-gradient-to-r from-yellow-400/30 to-amber-500/30 text-yellow-600 border-yellow-500",
      tooltip: "Enterprise tier member with VIP gold access",
    },
    enterprise: {
      label: "E",
      icon: Building,
      color: "bg-gradient-to-r from-yellow-400/30 to-amber-500/30 text-yellow-600 border-yellow-500",
      tooltip: "Enterprise tier member with VIP gold access",
    },
    // Alternative tier mappings
    FREE: {
      label: "Erigga Citizen",
      icon: User,
      color: "bg-green-500/20 text-green-600 border-green-500",
      tooltip: "Free tier member - Erigga Citizen",
    },
    free: {
      label: "Erigga Citizen",
      icon: User,
      color: "bg-green-500/20 text-green-600 border-green-500",
      tooltip: "Free tier member - Erigga Citizen",
    },
    PRO: {
      label: "Erigga Indigen",
      icon: Star,
      color: "bg-blue-500/20 text-blue-600 border-blue-500",
      tooltip: "Pro tier member - Erigga Indigen with premium access",
    },
    pro: {
      label: "Erigga Indigen",
      icon: Star,
      color: "bg-blue-500/20 text-blue-600 border-blue-500",
      tooltip: "Pro tier member - Erigga Indigen with premium access",
    },
    ENT: {
      label: "E",
      icon: Building,
      color: "bg-gradient-to-r from-yellow-400/30 to-amber-500/30 text-yellow-600 border-yellow-500",
      tooltip: "Enterprise tier member with VIP gold access",
    },
    ent: {
      label: "E",
      icon: Building,
      color: "bg-gradient-to-r from-yellow-400/30 to-amber-500/30 text-yellow-600 border-yellow-500",
      tooltip: "Enterprise tier member with VIP gold access",
    },
  }

  const normalizedTier = tier?.toLowerCase() || "free"
  const tierData = tierInfo[normalizedTier as keyof typeof tierInfo] || tierInfo.free

  const IconComponent = tierData.icon

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

  const isEnterprise = normalizedTier === "ent" || normalizedTier === "enterprise" || normalizedTier === "blood"

  const enterpriseClasses = isEnterprise
    ? "bg-gradient-to-r from-yellow-400/30 to-amber-500/30 text-yellow-600 border-yellow-500 shadow-lg shadow-yellow-400/25 hover:shadow-yellow-400/40 hover:from-yellow-400/40 hover:to-amber-500/40 font-bold"
    : ""

  const enterpriseTextStyle = isEnterprise && tierData.label === "E" ? "font-black text-xl tracking-wider" : ""

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${isEnterprise ? enterpriseClasses : tierData.color} ${sizeClasses[size]} font-medium transition-all duration-300 ${isEnterprise ? "animate-pulse" : ""}`}
          >
            <IconComponent className={`${iconSizes[size]} ${showLabel ? "mr-1" : ""}`} />
            {showLabel && <span className={enterpriseTextStyle}>{tierData.label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tierData.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default UserTierBadge
