"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Star, Users, Check, Zap, Shield, Sparkles } from "lucide-react"
import { getTierDisplayInfo, getAllTiers } from "@/hooks/useMembership"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function PremiumPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const allTiers = getAllTiers()
  const currentTierInfo = getTierDisplayInfo(profile?.tier || "erigga_citizen")

  const handleUpgrade = async (tier: string, price: number) => {
    if (!user) {
      router.push("/login")
      return
    }

    if (price === 0) {
      toast.info("You are already on the free tier!")
      return
    }

    setLoading(tier)
    try {
      const response = await fetch("/api/membership/payment/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier,
          amount: price * 100,
        }),
      })

      const data = await response.json()

      if (data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        toast.error("Failed to initialize payment")
      }
    } catch (error) {
      console.error("Error upgrading tier:", error)
      toast.error("Failed to process upgrade")
    } finally {
      setLoading(null)
    }
  }

  const getTierIcon = (color: string) => {
    switch (color) {
      case "green":
        return <Users className="w-12 h-12 text-green-600" />
      case "blue":
        return <Star className="w-12 h-12 text-blue-600" />
      case "yellow":
        return <Crown className="w-12 h-12 text-yellow-600" />
      default:
        return <Users className="w-12 h-12 text-gray-600" />
    }
  }

  const getTierGradient = (color: string) => {
    switch (color) {
      case "green":
        return "from-green-500 to-emerald-600"
      case "blue":
        return "from-blue-500 to-indigo-600"
      case "yellow":
        return "from-yellow-500 to-amber-600"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Membership Tier</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join the Erigga Live community and unlock exclusive content, events, and experiences
          </p>
          {profile && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current tier:</span>
              <Badge className={`bg-${currentTierInfo.color}-100 text-${currentTierInfo.color}-800`}>
                {currentTierInfo.label}
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {allTiers.map((tier) => {
            const isCurrentTier =
              profile?.tier ===
              Object.keys({ erigga_citizen: 0, erigga_indigen: 1, enterprise: 2 }).find(
                (key) => getTierDisplayInfo(key).label === tier.label,
              )
            const isUpgrade = tier.level > currentTierInfo.level

            return (
              <Card
                key={tier.label}
                className={`relative overflow-hidden ${
                  isCurrentTier
                    ? "border-2 border-primary shadow-xl"
                    : tier.level === 2
                      ? "border-2 border-yellow-400 shadow-xl"
                      : ""
                }`}
              >
                {isCurrentTier && (
                  <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
                    Current Plan
                  </div>
                )}
                {tier.level === 2 && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400" />
                )}

                <CardHeader className="text-center pb-8">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center">
                    <div
                      className={`w-14 h-14 rounded-full bg-gradient-to-br ${getTierGradient(tier.color)} flex items-center justify-center`}
                    >
                      {getTierIcon(tier.color)}
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{tier.label}</CardTitle>
                  <CardDescription className="mt-2">{tier.tooltip}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {tier.price === 0 ? "Free" : `₦${tier.price.toLocaleString()}`}
                    </span>
                    {tier.price > 0 && <span className="text-gray-600 dark:text-gray-400">/month</span>}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full mt-6"
                    variant={isCurrentTier ? "outline" : tier.level === 2 ? "default" : "secondary"}
                    disabled={isCurrentTier || loading === tier.label}
                    onClick={() =>
                      handleUpgrade(
                        Object.keys({ erigga_citizen: 0, erigga_indigen: 1, enterprise: 2 }).find(
                          (key) => getTierDisplayInfo(key).label === tier.label,
                        ) || "erigga_citizen",
                        tier.price,
                      )
                    }
                  >
                    {loading === tier.label ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Processing...
                      </span>
                    ) : isCurrentTier ? (
                      "Current Plan"
                    ) : isUpgrade ? (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Upgrade Now
                      </>
                    ) : (
                      "Choose Plan"
                    )}
                  </Button>

                  {tier.level === 2 && (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                        <Shield className="w-4 h-4" />
                        <span className="text-xs font-semibold">VIP Access Guaranteed</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Not sure which tier is right for you?</h3>
            <p className="mb-6 opacity-90">
              Start with Erigga Citizen for free and upgrade anytime to unlock more features
            </p>
            <Button variant="secondary" size="lg" onClick={() => router.push("/about")}>
              Learn More About Membership
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
