"use client"

import type { ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Crown, ArrowRight } from "lucide-react"
import Link from "next/link"

interface TierAccessControlProps {
  children: ReactNode
  requiredTier: string
  requiredRank?: number
  showUpgrade?: boolean
  customMessage?: string
  fallback?: ReactNode
}

// Tier rank mapping
const TIER_RANKS = {
  grassroot: 0,
  pioneer: 1,
  elder: 2,
  blood: 3,
}

const TIER_DISPLAY_NAMES = {
  grassroot: "Grassroot",
  pioneer: "Pioneer",
  elder: "Elder",
  blood: "Blood Brotherhood",
}

export function TierAccessControl({
  children,
  requiredTier,
  requiredRank,
  showUpgrade = true,
  customMessage,
  fallback,
}: TierAccessControlProps) {
  const { profile, isAuthenticated } = useAuth()

  // If user is not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
        <CardHeader className="text-center">
          <Lock className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <CardTitle>Login Required</CardTitle>
          <CardDescription>Please log in to access this content</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href="/login">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <ArrowRight className="h-4 w-4 mr-2" />
              Log In
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Get user's current tier rank
  const userTierRank = profile?.tier ? (TIER_RANKS[profile.tier as keyof typeof TIER_RANKS] ?? 0) : 0
  const requiredTierRank = requiredRank ?? TIER_RANKS[requiredTier as keyof typeof TIER_RANKS] ?? 0

  // Check if user has access
  const hasAccess = userTierRank >= requiredTierRank

  // If user has access, show the content
  if (hasAccess) {
    return <>{children}</>
  }

  // If fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>
  }

  // Show tier upgrade prompt
  const requiredTierDisplayName = TIER_DISPLAY_NAMES[requiredTier as keyof typeof TIER_DISPLAY_NAMES] || requiredTier
  const currentTierDisplayName = profile?.tier
    ? TIER_DISPLAY_NAMES[profile.tier as keyof typeof TIER_DISPLAY_NAMES] || profile.tier
    : "No tier"

  return (
    <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
      <CardHeader className="text-center">
        <Crown className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <CardTitle>Tier Upgrade Required</CardTitle>
        <CardDescription>
          {customMessage || (
            <>
              This content requires <strong>{requiredTierDisplayName}</strong> tier or higher.
              <br />
              Your current tier: <strong>{currentTierDisplayName}</strong>
            </>
          )}
        </CardDescription>
      </CardHeader>
      {showUpgrade && (
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">Upgrade your tier to unlock exclusive content and benefits</p>
          <div className="flex gap-4 justify-center">
            <Link href="/premium">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Crown className="h-4 w-4 mr-2" />
                View Tiers
              </Button>
            </Link>
            <Link href="/premium?upgrade=true">
              <Button variant="outline">
                <ArrowRight className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </Link>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Hook for checking tier access in components
export function useTierAccess() {
  const { profile } = useAuth()

  const checkAccess = (requiredTier: string, requiredRank?: number) => {
    if (!profile?.tier) return false

    const userTierRank = TIER_RANKS[profile.tier as keyof typeof TIER_RANKS] ?? 0
    const requiredTierRank = requiredRank ?? TIER_RANKS[requiredTier as keyof typeof TIER_RANKS] ?? 0

    return userTierRank >= requiredTierRank
  }

  const getUserTierRank = () => {
    if (!profile?.tier) return 0
    return TIER_RANKS[profile.tier as keyof typeof TIER_RANKS] ?? 0
  }

  return {
    checkAccess,
    getUserTierRank,
    currentTier: profile?.tier,
    currentTierRank: getUserTierRank(),
  }
}
