import { Crown, Shield, Users, Building } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useMembershipData } from "@/hooks/useMembership"
import { isMembershipFeatureEnabled } from "@/lib/membership"
import type { MembershipTierCode } from "@/lib/membership"

interface UserTierBadgeProps {
  tier: string
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  membershipTier?: MembershipTierCode // New membership tier prop
}

export function UserTierBadge({ tier, size = "md", showLabel = true, membershipTier }: UserTierBadgeProps) {
  const { membership } = useMembershipData()
  const membershipEnabled = isMembershipFeatureEnabled()

  const effectiveTier =
    membershipEnabled && (membershipTier || membership?.membership?.tier_code)
      ? membershipTier || membership?.membership?.tier_code
      : tier

  const membershipTierInfo = {
    FREE: {
      label: "ECor Erigga Citizen",
      icon: Users,
      color: "bg-gray-500/20 text-gray-500 border-gray-500",
      tooltip: "ECor Erigga Citizen - Basic community member",
    },
    PRO: {
      label: "Erigga Indigen",
      icon: Crown,
      color: "bg-blue-500/20 text-blue-500 border-blue-500",
      tooltip: "Erigga Indigen - Pro member with premium access",
    },
    ENT: {
      label: "E",
      icon: Building,
      color: "bg-yellow-500/20 text-yellow-500 border-yellow-500",
      tooltip: "Enterprise member with exclusive VIP access",
    },
  }

  const legacyTierInfo = {
    grassroot: {
      label: "ECor Erigga Citizen", // Updated label
      icon: Users, // Updated icon
      color: "bg-gray-500/20 text-gray-500 border-gray-500",
      tooltip: "ECor Erigga Citizen - Community member",
    },
    pioneer: {
      label: "Erigga Indigen", // Updated label
      icon: Crown,
      color: "bg-blue-500/20 text-blue-500 border-blue-500", // Updated color
      tooltip: "Erigga Indigen - Premium member with enhanced access",
    },
    elder: {
      label: "E", // Updated label
      icon: Building, // Updated icon
      color: "bg-yellow-500/20 text-yellow-500 border-yellow-500", // Updated to gold
      tooltip: "Enterprise member with exclusive VIP access",
    },
    blood_brotherhood: {
      label: "E", // Updated label
      icon: Building, // Updated icon
      color: "bg-yellow-500/20 text-yellow-500 border-yellow-500", // Updated to gold
      tooltip: "Enterprise member with exclusive VIP access",
    },
    blood: {
      label: "E", // Updated label
      icon: Building, // Updated icon
      color: "bg-yellow-500/20 text-yellow-500 border-yellow-500", // Updated to gold
      tooltip: "Enterprise member with exclusive VIP access",
    },
    admin: {
      label: "Admin",
      icon: Shield,
      color: "bg-red-500/20 text-red-500 border-red-500",
      tooltip: "Administrator with full system access",
    },
  }

  let tierData
  if (membershipEnabled && membershipTierInfo[effectiveTier as MembershipTierCode]) {
    tierData = membershipTierInfo[effectiveTier as MembershipTierCode]
  } else {
    tierData = legacyTierInfo[effectiveTier as keyof typeof legacyTierInfo] || legacyTierInfo.grassroot
  }

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
