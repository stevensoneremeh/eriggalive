import { Crown } from "lucide-react"

export function getTierDisplayInfo(tier: string) {
  const tierMap = {
    // Primary tier system - ONLY these 3 tiers
    erigga_citizen: {
      label: "Erigga Citizen",
      color: "green",
      level: 0,
      icon: Crown,
      tooltip: "Erigga Citizen - Community Member",
    },
    erigga_indigen: {
      label: "Erigga Indigen",
      color: "blue",
      level: 1,
      icon: Crown,
      tooltip: "Erigga Indigen - Premium Member",
    },
    enterprise: {
      label: "Enterprise",
      color: "yellow",
      level: 2,
      icon: Crown,
      tooltip: "Enterprise - VIP Member",
    },
    // API tier mappings (map to main tiers)
    FREE: {
      label: "Erigga Citizen",
      color: "green",
      level: 0,
      icon: Crown,
      tooltip: "Erigga Citizen - Community Member",
    },
    free: {
      label: "Erigga Citizen",
      color: "green",
      level: 0,
      icon: Crown,
      tooltip: "Erigga Citizen - Community Member",
    },
    PRO: { label: "Erigga Indigen", color: "blue", level: 1, icon: Crown, tooltip: "Erigga Indigen - Premium Member" },
    pro: { label: "Erigga Indigen", color: "blue", level: 1, icon: Crown, tooltip: "Erigga Indigen - Premium Member" },
    ENT: { label: "Enterprise", color: "yellow", level: 2, icon: Crown, tooltip: "Enterprise - VIP Member" },
    ent: { label: "Enterprise", color: "yellow", level: 2, icon: Crown, tooltip: "Enterprise - VIP Member" },
  }

  const normalizedTier = tier?.toLowerCase() || "free"
  return tierMap[normalizedTier as keyof typeof tierMap] || tierMap.erigga_citizen
}

export function hasTierAccess(userTier: string, requiredTier: string): boolean {
  const userInfo = getTierDisplayInfo(userTier)
  const requiredInfo = getTierDisplayInfo(requiredTier)
  return userInfo.level >= requiredInfo.level
}

export function mapLegacyTierToNew(oldTier: string): string {
  const mapping = {
    // Map old/legacy tiers to the 3 main tiers
    free: "erigga_citizen",
    pro: "erigga_indigen",
    ent: "enterprise",
    // Handle any other legacy tier names
    citizen: "erigga_citizen",
    indigen: "erigga_indigen",
  }

  const normalized = oldTier?.toLowerCase() || "erigga_citizen"
  return mapping[normalized as keyof typeof mapping] || "erigga_citizen"
}
