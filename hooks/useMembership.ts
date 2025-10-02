"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"

export type MembershipTier = "erigga_citizen" | "erigga_indigen" | "enterprise"

export interface MembershipInfo {
  tier: MembershipTier
  displayName: string
  description: string
  price: number
  features: string[]
  color: string
  icon: string
  isActive: boolean
  expiresAt?: string
}

const TIER_INFO: Record<MembershipTier, Omit<MembershipInfo, "isActive" | "expiresAt" | "tier">> = {
  erigga_citizen: {
    displayName: "Erigga Citizen",
    description: "Basic membership with access to community features",
    price: 0,
    features: ["Access to community forum", "Basic profile customization", "Limited event access", "Standard support"],
    color: "bg-gray-500",
    icon: "👤",
  },
  erigga_indigen: {
    displayName: "Erigga Indigen",
    description: "Premium membership with exclusive content and perks",
    price: 5000,
    features: [
      "All Citizen features",
      "Exclusive content access",
      "Priority event tickets",
      "Custom profile badge",
      "Monthly rewards",
      "Priority support",
    ],
    color: "bg-brand-teal",
    icon: "⭐",
  },
  enterprise: {
    displayName: "Enterprise",
    description: "Ultimate membership with all features and VIP access",
    price: 15000,
    features: [
      "All Indigen features",
      "VIP event access",
      "Meet & greet opportunities",
      "Exclusive merchandise",
      "Direct artist contact",
      "Lifetime badge",
      "24/7 VIP support",
    ],
    color: "bg-brand-lime",
    icon: "👑",
  },
}

export function useMembership(userId?: string) {
  const supabase = createClientComponentClient<Database>()
  const [membership, setMembership] = useState<MembershipInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMembership() {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const { data: user, error: userError } = await supabase
          .from("users")
          .select("tier, subscription_expires_at")
          .eq("id", userId)
          .single()

        if (userError) {
          throw userError
        }

        if (!user) {
          setMembership(null)
          return
        }

        const tier = user.tier as MembershipTier
        const tierInfo = TIER_INFO[tier]
        const expiresAt = user.subscription_expires_at

        const isActive = !expiresAt || new Date(expiresAt) > new Date()

        setMembership({
          tier,
          ...tierInfo,
          isActive,
          expiresAt: expiresAt || undefined,
        })
      } catch (err: any) {
        console.error("Error fetching membership:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMembership()
  }, [userId, supabase])

  const getTierInfo = (tier: MembershipTier): MembershipInfo => {
    return {
      tier,
      ...TIER_INFO[tier],
      isActive: true,
    }
  }

  const canAccessFeature = (feature: string): boolean => {
    if (!membership) return false
    return membership.features.includes(feature)
  }

  return {
    membership,
    loading,
    error,
    getTierInfo,
    canAccessFeature,
    allTiers: Object.keys(TIER_INFO) as MembershipTier[],
  }
}
