"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Building, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { MembershipTier, Membership } from "@/lib/types/ticketing"

interface MembershipTiersProps {
  onSelectTier?: (tier: MembershipTier, interval?: string) => void
}

export function MembershipTiers({ onSelectTier }: MembershipTiersProps) {
  const [tiers, setTiers] = useState<MembershipTier[]>([])
  const [userMembership, setUserMembership] = useState<Membership | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch tiers and user membership in parallel
      const [tiersResponse, membershipResponse] = await Promise.all([
        fetch("/api/memberships/tiers"),
        fetch("/api/memberships/user"),
      ])

      const tiersData = await tiersResponse.json()
      const membershipData = await membershipResponse.json()

      if (tiersData.success) {
        setTiers(tiersData.tiers)
      }

      if (membershipData.success) {
        setUserMembership(membershipData.membership)
      }
    } catch (error) {
      console.error("Failed to fetch membership data:", error)
      toast({
        title: "Error",
        description: "Failed to load membership information",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getTierIcon = (code: string) => {
    switch (code) {
      case "FREE":
        return <Users className="h-6 w-6" />
      case "PRO":
        return <Crown className="h-6 w-6" />
      case "ENT":
        return <Building className="h-6 w-6" />
      default:
        return <Users className="h-6 w-6" />
    }
  }

  const getTierColor = (code: string) => {
    switch (code) {
      case "FREE":
        return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
      case "PRO":
        return "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20"
      case "ENT":
        return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
      default:
        return "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20"
    }
  }

  const isCurrentTier = (tierCode: string) => {
    return userMembership?.tier_code === tierCode
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-2">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {tiers.map((tier) => (
        <Card
          key={tier.id}
          className={`relative ${getTierColor(tier.code)} ${isCurrentTier(tier.code) ? "ring-2 ring-blue-500" : ""}`}
        >
          {isCurrentTier(tier.code) && (
            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">Current Plan</Badge>
          )}

          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-white dark:bg-gray-800 w-fit">
              {getTierIcon(tier.code)}
            </div>
            <CardTitle className="text-xl">{tier.name}</CardTitle>
            <CardDescription>{tier.description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Pricing for Pro tier */}
            {tier.code === "PRO" && (tier as any).pricing && (
              <div className="space-y-2">
                <div className="text-center">
                  <div className="text-2xl font-bold">₦{(tier as any).pricing.monthly.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">per month</div>
                </div>
                <div className="text-xs text-center text-gray-500">
                  Quarterly: ₦{(tier as any).pricing.quarterly.toLocaleString()} • Yearly: ₦
                  {(tier as any).pricing.yearly.toLocaleString()}
                </div>
              </div>
            )}

            {/* Enterprise custom pricing */}
            {tier.code === "ENT" && (
              <div className="text-center">
                <div className="text-2xl font-bold">Custom</div>
                <div className="text-sm text-gray-600">Annual payment</div>
              </div>
            )}

            {/* Free tier */}
            {tier.code === "FREE" && (
              <div className="text-center">
                <div className="text-2xl font-bold">Free</div>
                <div className="text-sm text-gray-600">Forever</div>
              </div>
            )}

            {/* Features */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Community access</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Basic features</span>
              </div>
              {tier.code !== "FREE" && (
                <>
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Premium content</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">1,000 coins per month</span>
                  </div>
                </>
              )}
              {tier.code === "ENT" && (
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">VIP access</span>
                </div>
              )}
            </div>

            {/* Action Button */}
            {!isCurrentTier(tier.code) && onSelectTier && (
              <Button
                className="w-full"
                variant={tier.code === "FREE" ? "outline" : "default"}
                onClick={() => onSelectTier(tier)}
              >
                {tier.code === "FREE" ? "Downgrade" : "Upgrade"}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
