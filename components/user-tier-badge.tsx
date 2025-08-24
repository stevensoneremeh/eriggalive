import { Crown, Shield, Droplet, User, Building } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface UserTierBadgeProps {
  tier: string
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

export function UserTierBadge({ tier, size = "md", showLabel = true }: UserTierBadgeProps) {
  const tierInfo = {
    // Legacy grassroot system (keeping for backward compatibility)
    grassroot: {
      label: "ECor Erigga Citizen",
      icon: User,
      color: "bg-gray-500/20 text-gray-500 border-gray-500",
      tooltip: "Free tier member - ECor Erigga Citizen",
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
    // New membership tier system
    FREE: {
      label: "ECor Erigga Citizen",
      icon: User,
      color: "bg-gray-500/20 text-gray-500 border-gray-500",
      tooltip: "Free tier member - ECor Erigga Citizen",
    },
    PRO: {
      label: "Erigga Indigen",
      icon: Crown,
      color: "bg-blue-500/20 text-blue-500 border-blue-500",
      tooltip: "Pro tier member - Erigga Indigen with premium access",
    },
    ENT: {
      label: "E",
      icon: Building,
      color: "bg-yellow-500/20 text-yellow-500 border-yellow-500",
      tooltip: "Enterprise tier member with VIP gold access",
    },
  }

  // Map legacy tiers to new system
  const normalizedTier =
    tier?.toLowerCase() === "free"
      ? "FREE"
      : tier?.toLowerCase() === "pro"
        ? "PRO"
        : tier?.toLowerCase() === "enterprise"
          ? "ENT"
          : tier

  const tierData = tierInfo[normalizedTier as keyof typeof tierInfo] || tierInfo.FREE

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

  const isEnterprise = normalizedTier === "ENT"
  const enterpriseClasses = isEnterprise
    ? "bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 text-yellow-400 border-yellow-400 shadow-lg shadow-yellow-400/20"
    : ""

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${isEnterprise ? enterpriseClasses : tierData.color} ${sizeClasses[size]} font-medium transition-all duration-200 ${isEnterprise ? "hover:shadow-yellow-400/30" : ""}`}
          >
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
