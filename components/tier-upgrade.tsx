"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, Crown, Shield, Droplets, Star, CreditCard, AlertCircle, Loader2, Info, Lock } from "lucide-react"

interface Tier {
  id: number
  name: string
  display_name: string
  description: string
  price: number
  benefits: string[]
  rank: number
  color: string
  icon: string
  is_active: boolean
}

interface TierUpgradeProps {
  onUpgradeSuccess?: (newTier: string) => void
}

const TIER_ICONS = {
  star: Star,
  crown: Crown,
  shield: Shield,
  droplets: Droplets,
}

const TIER_COLORS = {
  "#6b7280": "text-gray-500 bg-gray-500/10 border-gray-500/20",
  "#f97316": "text-orange-500 bg-orange-500/10 border-orange-500/20",
  "#eab308": "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  "#dc2626": "text-red-500 bg-red-500/10 border-red-500/20",
}

export function TierUpgrade({ onUpgradeSuccess }: TierUpgradeProps) {
  const { profile, refreshSession } = useAuth()
  const { toast } = useToast()

  const [tiers, setTiers] = useState<Tier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPaystackLoaded, setIsPaystackLoaded] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // Check if we're in preview mode
  useEffect(() => {
    const checkPreviewMode = () => {
      const isPreview =
        process.env.NODE_ENV === "development" ||
        window.location.hostname.includes("vercel.app") ||
        window.location.hostname.includes("localhost")
      setIsPreviewMode(isPreview)
    }
    checkPreviewMode()
  }, [])

  // Load Paystack script
  useEffect(() => {
    const loadPaystack = () => {
      if (typeof window !== "undefined") {
        if (window.PaystackPop) {
          setIsPaystackLoaded(true)
          return
        }

        const existingScript = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]')
        if (existingScript) {
          existingScript.addEventListener("load", () => setIsPaystackLoaded(true))
          return
        }

        const script = document.createElement("script")
        script.src = "https://js.paystack.co/v1/inline.js"
        script.async = true
        script.onload = () => setIsPaystackLoaded(true)
        script.onerror = () => setError("Failed to load payment gateway")
        document.head.appendChild(script)
      }
    }
    loadPaystack()
  }, [])

  // Fetch available tiers
  const fetchTiers = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/tiers")
      const data = await response.json()

      if (data.success) {
        setTiers(data.tiers)
      } else {
        setError("Failed to load available tiers")
      }
    } catch (err) {
      setError("Failed to load tiers")
      console.error("Fetch tiers error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTiers()
  }, [fetchTiers])

  // Get current user tier rank
  const getCurrentTierRank = useCallback(() => {
    if (!profile?.tier) return 0
    const currentTier = tiers.find((t) => t.name === profile.tier)
    return currentTier?.rank || 0
  }, [profile?.tier, tiers])

  // Check if user can upgrade to a tier
  const canUpgradeTo = useCallback(
    (tier: Tier) => {
      const currentRank = getCurrentTierRank()
      return tier.rank > currentRank
    },
    [getCurrentTierRank],
  )

  // Check if tier is user's current tier
  const isCurrentTier = useCallback(
    (tier: Tier) => {
      return tier.name === profile?.tier
    },
    [profile?.tier],
  )

  // Handle tier upgrade
  const handleUpgrade = useCallback(
    async (tier: Tier) => {
      if (!profile?.email || !isPaystackLoaded) return

      setIsUpgrading(true)
      setError(null)
      setSelectedTier(tier)

      try {
        const paymentReference = `tier_upgrade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        const paystackConfig = {
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_0123456789abcdef0123456789abcdef01234567",
          email: profile.email,
          amount: Math.round(tier.price * 100), // Convert to kobo
          currency: "NGN",
          ref: paymentReference,
          metadata: {
            tier_id: tier.id,
            tier_name: tier.name,
            user_id: profile.id,
            upgrade_type: "tier_upgrade",
            preview_mode: isPreviewMode,
          },
          callback: async (response: any) => {
            try {
              // Verify payment and process upgrade
              const upgradeResponse = await fetch("/api/tiers/upgrade", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("auth_token") || "mock-token"}`,
                },
                body: JSON.stringify({
                  tier_id: tier.id,
                  payment_reference: response.reference,
                  amount: tier.price,
                }),
              })

              const upgradeData = await upgradeResponse.json()

              if (upgradeData.success) {
                toast({
                  title: "Upgrade Successful!",
                  description: upgradeData.message,
                  duration: 5000,
                })

                if (upgradeData.auto_upgrade && refreshSession) {
                  // Refresh session to get updated user data
                  await refreshSession()
                }

                if (onUpgradeSuccess && upgradeData.new_tier) {
                  onUpgradeSuccess(upgradeData.new_tier)
                }

                // Refresh tiers to update UI
                await fetchTiers()
              } else {
                throw new Error(upgradeData.error || "Upgrade failed")
              }
            } catch (err) {
              console.error("Upgrade processing error:", err)
              const errorMessage = err instanceof Error ? err.message : "Upgrade processing failed"
              setError(errorMessage)
              toast({
                title: "Upgrade Failed",
                description: errorMessage,
                variant: "destructive",
                duration: 8000,
              })
            }
          },
          onClose: () => {
            setIsUpgrading(false)
            setSelectedTier(null)
          },
        }

        if (window.PaystackPop) {
          const handler = window.PaystackPop.setup(paystackConfig)
          handler.openIframe()
        } else {
          throw new Error("Payment gateway not available")
        }
      } catch (err) {
        console.error("Payment initiation error:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to initiate payment"
        setError(errorMessage)
        toast({
          title: "Payment Failed",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        })
        setIsUpgrading(false)
        setSelectedTier(null)
      }
    },
    [profile, isPaystackLoaded, isPreviewMode, toast, onUpgradeSuccess, refreshSession, fetchTiers],
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-2">Loading tiers...</span>
      </div>
    )
  }

  if (!profile) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Please log in to view tier upgrade options.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Upgrade Your Tier</h2>
        <p className="text-muted-foreground">Unlock exclusive content and benefits by upgrading to a higher tier</p>
        {profile.tier && (
          <Badge variant="outline" className="mt-2">
            Current: {tiers.find((t) => t.name === profile.tier)?.display_name || profile.tier}
          </Badge>
        )}
      </div>

      {isPreviewMode && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>Preview Mode: Payments will be simulated for testing purposes.</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isPaystackLoaded && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Loading payment gateway...</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => {
          const Icon = TIER_ICONS[tier.icon as keyof typeof TIER_ICONS] || Star
          const colorClasses = TIER_COLORS[tier.color as keyof typeof TIER_COLORS] || TIER_COLORS["#6b7280"]
          const isCurrent = isCurrentTier(tier)
          const canUpgrade = canUpgradeTo(tier)
          const isProcessing = isUpgrading && selectedTier?.id === tier.id

          return (
            <Card
              key={tier.id}
              className={`relative transition-all duration-300 ${
                isCurrent
                  ? `${colorClasses} ring-2 ring-current ring-offset-2 ring-offset-background`
                  : canUpgrade
                    ? "hover:scale-105 hover:shadow-lg cursor-pointer"
                    : "opacity-60"
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-green-500 text-white">Current Tier</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${colorClasses}`}>
                  <Icon className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl">{tier.display_name}</CardTitle>
                <CardDescription className="text-sm">{tier.description}</CardDescription>
                <div className="text-2xl font-bold">
                  ₦{tier.price.toLocaleString()}
                  <span className="text-sm text-muted-foreground font-normal">/month</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {tier.benefits.slice(0, 4).map((benefit, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                  {tier.benefits.length > 4 && (
                    <div className="text-sm text-muted-foreground">+{tier.benefits.length - 4} more benefits</div>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleUpgrade(tier)}
                  disabled={!canUpgrade || isCurrent || isProcessing || !isPaystackLoaded}
                  variant={isCurrent ? "outline" : "default"}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrent ? (
                    "Active"
                  ) : !canUpgrade ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Lower Tier
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      {isPreviewMode ? "Simulate Upgrade" : "Upgrade Now"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>All payments are processed securely through Paystack</p>
        <p>You can cancel your subscription at any time</p>
        {isPreviewMode && <p className="text-orange-600 font-medium">Preview mode: No real money will be charged</p>}
      </div>
    </div>
  )
}

// TypeScript declarations
declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string
        email: string
        amount: number
        currency: string
        ref: string
        metadata?: any
        callback: (response: any) => void
        onClose: () => void
      }) => {
        openIframe: () => void
      }
    }
  }
}
