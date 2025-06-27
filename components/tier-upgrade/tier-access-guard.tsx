"use client"

import type { ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, Crown } from "lucide-react"
import Link from "next/link"

interface TierAccessGuardProps {
  children: ReactNode
  requiredTier: string
  requiredTierRank: number
  fallbackTitle?: string
  fallbackDescription?: string
}

export function TierAccessGuard({
  children,
  requiredTier,
  requiredTierRank,
  fallbackTitle = "Premium Content",
  fallbackDescription = "This content is only available to premium members.",
}: TierAccessGuardProps) {
  const { profile } = useAuth()

  // For now, we'll use a simple tier ranking system
  const getTierRank = (tier: string): number => {
    const tierRanks = {
      grassroot: 0,
      pioneer: 1,
      elder: 2,
      blood: 3,
    }
    return tierRanks[tier as keyof typeof tierRanks] || 0
  }

  const userTierRank = profile?.tier ? getTierRank(profile.tier) : 0
  const hasAccess = userTierRank >= requiredTierRank

  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <Card className="border-2 border-dashed border-muted-foreground/25">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Crown className="h-5 w-5 text-orange-500" />
          {fallbackTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">{fallbackDescription}</p>
        <p className="text-sm text-muted-foreground">
          Requires: <span className="font-semibold capitalize">{requiredTier}</span> tier or higher
        </p>
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link href="/premium">Upgrade Now</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
