export function getTierDisplayInfo(tier: string) {
  const tierMap = {
    grassroot: { label: "ECor Erigga Citizen", color: "gray", level: 0 },
    pioneer: { label: "Erigga Indigen", color: "blue", level: 1 },
    elder: { label: "Elder", color: "gold", level: 2 },
    blood: { label: "Blood", color: "red", level: 3 },
    FREE: { label: "ECor Erigga Citizen", color: "gray", level: 0 },
    PRO: { label: "Erigga Indigen", color: "blue", level: 1 },
    ENT: { label: "E", color: "yellow", level: 2 },
  }

  const normalizedTier = tier?.toUpperCase() || "FREE"
  return tierMap[normalizedTier as keyof typeof tierMap] || tierMap.FREE
}

export function hasTierAccess(userTier: string, requiredTier: string): boolean {
  const userInfo = getTierDisplayInfo(userTier)
  const requiredInfo = getTierDisplayInfo(requiredTier)
  return userInfo.level >= requiredInfo.level
}
