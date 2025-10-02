import { Crown, Users, Star } from "lucide-react"

export type TierLevel = "erigga_citizen" | "erigga_indigen" | "enterprise"

export interface TierInfo {
  label: string
  color: string
  level: number
  icon: typeof Crown
  tooltip: string
  price: number
  features: string[]
}

const TIER_MAP: Record<string, TierInfo> = {
  // Primary tiers
  erigga_citizen: {
    label: "Erigga Citizen",
    color: "green",
    level: 0,
    icon: Users,
    tooltip: "Erigga Citizen - Community Member",
    price: 0,
    features: ["Access to community forums", "Basic profile customization", "Limited event access", "Standard support"],
  },
  erigga_indigen: {
    label: "Erigga Indigen",
    color: "blue",
    level: 1,
    icon: Star,
    tooltip: "Erigga Indigen - Premium Member",
    price: 5000,
    features: [
      "All Citizen features",
      "Exclusive content access",
      "Priority event tickets",
      "Custom profile badge",
      "Monthly coin rewards",
      "Priority support",
    ],
  },
  enterprise: {
    label: "Enterprise",
    color: "yellow",
    level: 2,
    icon: Crown,
    tooltip: "Enterprise - VIP Member",
    price: 15000,
    features: [
      "All Indigen features",
      "VIP event access",
      "Meet & greet opportunities",
      "Exclusive merchandise discounts",
      "Direct artist engagement",
      "Lifetime achievement badge",
      "24/7 VIP support",
    ],
  },
  // API mappings
  FREE: {
    label: "Erigga Citizen",
    color: "green",
    level: 0,
    icon: Users,
    tooltip: "Erigga Citizen - Community Member",
    price: 0,
    features: [],
  },
  free: {
    label: "Erigga Citizen",
    color: "green",
    level: 0,
    icon: Users,
    tooltip: "Erigga Citizen - Community Member",
    price: 0,
    features: [],
  },
  PRO: {
    label: "Erigga Indigen",
    color: "blue",
    level: 1,
    icon: Star,
    tooltip: "Erigga Indigen - Premium Member",
    price: 5000,
    features: [],
  },
  pro: {
    label: "Erigga Indigen",
    color: "blue",
    level: 1,
    icon: Star,
    tooltip: "Erigga Indigen - Premium Member",
    price: 5000,
    features: [],
  },
  ENT: {
    label: "Enterprise",
    color: "yellow",
    level: 2,
    icon: Crown,
    tooltip: "Enterprise - VIP Member",
    price: 15000,
    features: [],
  },
  ent: {
    label: "Enterprise",
    color: "yellow",
    level: 2,
    icon: Crown,
    tooltip: "Enterprise - VIP Member",
    price: 15000,
    features: [],
  },
}

export function getTierDisplayInfo(tier: string): TierInfo {
  const normalizedTier = tier?.toLowerCase() || "erigga_citizen"
  return TIER_MAP[normalizedTier] || TIER_MAP.erigga_citizen
}

export function hasTierAccess(userTier: string, requiredTier: string): boolean {
  const userInfo = getTierDisplayInfo(userTier)
  const requiredInfo = getTierDisplayInfo(requiredTier)
  return userInfo.level >= requiredInfo.level
}

export function mapLegacyTierToNew(oldTier: string): TierLevel {
  const normalized = oldTier?.toLowerCase() || "erigga_citizen"

  // Map any legacy or alternate names to the 3 main tiers
  const legacyMapping: Record<string, TierLevel> = {
    free: "erigga_citizen",
    citizen: "erigga_citizen",
    pro: "erigga_indigen",
    indigen: "erigga_indigen",
    ent: "enterprise",
    enterprise: "enterprise",
    erigga_citizen: "erigga_citizen",
    erigga_indigen: "erigga_indigen",
  }

  return legacyMapping[normalized] || "erigga_citizen"
}

export function getAllTiers(): TierInfo[] {
  return [TIER_MAP.erigga_citizen, TIER_MAP.erigga_indigen, TIER_MAP.enterprise]
}

export function getTierByLevel(level: number): TierInfo {
  switch (level) {
    case 0:
      return TIER_MAP.erigga_citizen
    case 1:
      return TIER_MAP.erigga_indigen
    case 2:
      return TIER_MAP.enterprise
    default:
      return TIER_MAP.erigga_citizen
  }
}
