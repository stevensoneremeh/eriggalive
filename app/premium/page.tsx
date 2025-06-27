"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { tierService, type TierWithAccess } from "@/lib/tier-service"
import { TierCard } from "@/components/tier-upgrade/tier-card"
import { TierUpgradeModal } from "@/components/tier-upgrade/tier-upgrade-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Crown, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

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

export default function PremiumPage() {
  const { profile, refreshSession } = useAuth()
  const { toast } = useToast()

  const [tiers, setTiers] = useState<TierWithAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaystackLoaded, setIsPaystackLoaded] = useState(false)
  const [upgradeModal, setUpgradeModal] = useState<{
    isOpen: boolean
    tierName: string
    amount: number
    reference: string
  }>({
    isOpen: false,
    tierName: "",
    amount: 0,
    reference: "",
  })

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
        script.onerror = () => {
          toast({
            title: "Error",
            description: "Failed to load payment gateway. Please refresh the page.",
            variant: "destructive",
          })
        }
        document.head.appendChild(script)
      }
    }

    loadPaystack()
  }, [toast])

  // Load tiers
  useEffect(() => {
    loadTiers()
  }, [profile])

  const loadTiers = async () => {
    try {
      setLoading(true)

      // Get current user tier
      let userTierId: number | undefined
      if (profile?.id) {
        const currentTier = await tierService.getUserCurrentTier(Number.parseInt(profile.id))
        userTierId = currentTier?.id
      }

      const tiersData = await tierService.getTiersWithUserAccess(userTierId)
      setTiers(tiersData)
    } catch (error) {
      console.error("Error loading tiers:", error)
      toast({
        title: "Error",
        description: "Failed to load subscription tiers. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (tierId: number, amount: number) => {
    if (!profile?.email || !profile?.id) {
      toast({
        title: "Error",
        description: "Please log in to upgrade your tier.",
        variant: "destructive",
      })
      return
    }

    if (!isPaystackLoaded) {
      toast({
        title: "Error",
        description: "Payment gateway not ready. Please wait a moment and try again.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Create payment record
      const paymentResult = await tierService.createPayment(Number.parseInt(profile.id), tierId, amount)

      if (!paymentResult) {
        throw new Error("Failed to create payment record")
      }

      const { payment, reference } = paymentResult

      // Get current tier for upgrade record
      const currentTier = await tierService.getUserCurrentTier(Number.parseInt(profile.id))

      // Create tier upgrade record
      await tierService.createTierUpgrade(Number.parseInt(profile.id), currentTier?.id || null, tierId, payment.id)

      // Get tier name for display
      const selectedTier = tiers.find((t) => t.id === tierId)
      const tierName = selectedTier?.name || "Premium"

      // Initialize Paystack payment
      if (window.PaystackPop) {
        const handler = window.PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_0123456789abcdef0123456789abcdef01234567",
          email: profile.email,
          amount: Math.round(amount * 100), // Convert to kobo
          currency: "NGN",
          ref: reference,
          metadata: {
            tier_id: tierId,
            user_id: profile.id,
            tier_name: tierName,
            upgrade_type: "tier_upgrade",
          },
          callback: (response: any) => {
            console.log("Payment successful:", response)
            setUpgradeModal({
              isOpen: true,
              tierName,
              amount,
              reference: response.reference,
            })
          },
          onClose: () => {
            console.log("Payment dialog closed")
            setIsProcessing(false)
          },
        })

        handler.openIframe()
      } else {
        throw new Error("Payment gateway not available")
      }
    } catch (error) {
      console.error("Error processing upgrade:", error)
      toast({
        title: "Upgrade Failed",
        description: error instanceof Error ? error.message : "An error occurred while processing your upgrade",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const handleUpgradeSuccess = async () => {
    // Refresh user session to get updated tier
    if (refreshSession) {
      await refreshSession()
    }

    // Reload tiers to update UI
    await loadTiers()

    toast({
      title: "Upgrade Complete!",
      description: "Your tier has been successfully upgraded. Enjoy your new benefits!",
      duration: 5000,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading subscription tiers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="font-street text-4xl md:text-6xl text-gradient mb-4">JOIN THE CIRCLE</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get closer to the culture. Unlock exclusive content, early access, and VIP experiences.
          </p>
        </div>

        {!isPaystackLoaded && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>Loading payment gateway...</AlertDescription>
          </Alert>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tiers.map((tier) => (
            <TierCard key={tier.id} tier={tier} onUpgrade={handleUpgrade} isProcessing={isProcessing} />
          ))}
        </div>

        {/* Benefits Comparison */}
        <Card className="bg-card/50 border-orange-500/20 mb-12">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-street text-gradient">TIER COMPARISON</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-orange-500/20">
                    <th className="text-left py-4 px-2">Features</th>
                    {tiers.map((tier) => (
                      <th
                        key={tier.id}
                        className={`text-center py-4 px-2 ${
                          tier.isCurrentTier ? "text-primary font-bold" : "text-muted-foreground"
                        }`}
                      >
                        {tier.name}
                        {tier.isCurrentTier && <div className="text-xs">(Current)</div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Generate comparison rows based on all benefits */}
                  {Array.from(new Set(tiers.flatMap((tier) => tier.benefits))).map((benefit, index) => (
                    <tr key={index} className="border-b border-orange-500/10">
                      <td className="py-3 px-2 font-medium text-sm">{benefit}</td>
                      {tiers.map((tier) => (
                        <td key={tier.id} className="text-center py-3 px-2">
                          {tier.benefits.includes(benefit) ? (
                            <span className="text-green-500">✓</span>
                          ) : (
                            <span className="text-red-500">✕</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-orange-500/20">
          <CardContent className="p-8 text-center">
            <Crown className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Secure Payment with Paystack</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              All payments are processed securely through Paystack. Cancel anytime. Your subscription helps support
              Erigga and the community.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span>• Secure Payment</span>
              <span>• Cancel Anytime</span>
              <span>• Instant Access</span>
              <span>• 24/7 Support</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <TierUpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal((prev) => ({ ...prev, isOpen: false }))}
        tierName={upgradeModal.tierName}
        amount={upgradeModal.amount}
        paymentReference={upgradeModal.reference}
        onSuccess={handleUpgradeSuccess}
      />
    </div>
  )
}
