import { Crown } from "lucide-react"

export function getTierDisplayInfo(tier: string) {
  const tierMap = {
    // Primary tier system
    erigga_citizen: { label: "Erigga Citizen", color: "green", level: 0, icon: Crown, tooltip: "Erigga Citizen - Community Member" },
    erigga_indigen: { label: "Erigga Indigen", color: "blue", level: 1, icon: Crown, tooltip: "Erigga Indigen - Premium Member" },
    enterprise: { label: "E", color: "yellow", level: 2, icon: Crown, tooltip: "Enterprise - VIP Member" },
    // API tier mappings
    FREE: { label: "Erigga Citizen", color: "green", level: 0, icon: Crown, tooltip: "Erigga Citizen - Community Member" },
    free: { label: "Erigga Citizen", color: "green", level: 0, icon: Crown, tooltip: "Erigga Citizen - Community Member" },
    PRO: { label: "Erigga Indigen", color: "blue", level: 1, icon: Crown, tooltip: "Erigga Indigen - Premium Member" },
    pro: { label: "Erigga Indigen", color: "blue", level: 1, icon: Crown, tooltip: "Erigga Indigen - Premium Member" },
    ENT: { label: "E", color: "yellow", level: 2, icon: Crown, tooltip: "Enterprise - VIP Member" },
    ent: { label: "E", color: "yellow", level: 2, icon: Crown, tooltip: "Enterprise - VIP Member" },
  }

  const normalizedTier = tier?.toLowerCase() || "free"
  return tierMap[normalizedTier as keyof typeof tierMap] || tierMap.free
}

export function hasTierAccess(userTier: string, requiredTier: string): boolean {
  const userInfo = getTierDisplayInfo(userTier)
  const requiredInfo = getTierDisplayInfo(requiredTier)
  return userInfo.level >= requiredInfo.level
}

export function mapLegacyTierToNew(oldTier: string): string {
  const mapping = {
    grassroot: "erigga_citizen",
    pioneer: "erigga_indigen",
    elder: "erigga_indigen",
    blood: "enterprise",
    blood_brotherhood: "enterprise",
    free: "erigga_citizen",
    pro: "erigga_indigen",
    ent: "enterprise",
  }

  const normalized = oldTier?.toLowerCase() || "erigga_citizen"
  return mapping[normalized as keyof typeof mapping] || "erigga_citizen"
}
