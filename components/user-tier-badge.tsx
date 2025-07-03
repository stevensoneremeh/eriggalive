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
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${tierData.color} ${sizeClasses[size]} font-medium`}>
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
