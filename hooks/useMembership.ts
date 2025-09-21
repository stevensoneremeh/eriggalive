export function getTierDisplayInfo(tier: string) {
  const tierMap = {
    // New tier system
    erigga_citizen: { label: "Erigga Citizen", color: "green", level: 0 },
    erigga_indigen: { label: "Erigga Indigen", color: "blue", level: 1 },
    enterprise: { label: "E", color: "yellow", level: 2 },
    // Legacy tier mappings for backward compatibility
    grassroot: { label: "Erigga Citizen", color: "green", level: 0 },
    pioneer: { label: "Erigga Indigen", color: "blue", level: 1 },
    elder: { label: "Erigga Indigen", color: "blue", level: 1 },
    blood: { label: "E", color: "yellow", level: 2 },
    blood_brotherhood: { label: "E", color: "yellow", level: 2 },
    // Alternative mappings
    FREE: { label: "Erigga Citizen", color: "green", level: 0 },
    free: { label: "Erigga Citizen", color: "green", level: 0 },
    PRO: { label: "Erigga Indigen", color: "blue", level: 1 },
    pro: { label: "Erigga Indigen", color: "blue", level: 1 },
    ENT: { label: "E", color: "yellow", level: 2 },
    ent: { label: "E", color: "yellow", level: 2 },
  }

  const normalizedTier = tier?.toLowerCase() || "erigga_citizen"
  return tierMap[normalizedTier as keyof typeof tierMap] || tierMap.erigga_citizen
}

export function hasTierAccess(userTier: string, requiredTier: string): boolean {
  const userInfo = getTierDisplayInfo(userTier)
  const requiredInfo = getTierDisplayInfo(requiredTier)
  return userInfo.level >= requiredInfo.level
}
