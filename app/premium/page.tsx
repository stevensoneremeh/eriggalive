"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AnimatedTierCards } from "@/components/tier-system/animated-tier-cards"
import { TierComparisonTable } from "@/components/tier-system/tier-comparison-table"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Zap, CreditCard, Globe, Shield } from "lucide-react"

export default function PremiumPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [billingInterval, setBillingInterval] = useState<string>("monthly")
  const [customAmount, setCustomAmount] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)

  const tierPrices = {
    pro: {
      monthly: 8000,
      quarterly: 21600, // 10% discount
      annual: 76800, // 20% discount
    },
    enterprise: {
      monthly: 25000,
      quarterly: 67500, // 10% discount
      annual: 240000, // 20% discount (minimum for custom)
    },
  }

  const handleTierUpgrade = (tierId: string) => {
    setSelectedTier(tierId)
  }

  const validateCustomAmount = (amount: string): boolean => {
    const numAmount = Number.parseInt(amount)
    return numAmount >= 150000 // Minimum 150,000 annually for Enterprise
  }

  const handlePaymentWithPage = async () => {
    if (!selectedTier || !profile?.email) return

    setIsProcessing(true)

    try {
      let amount: number

      if (selectedTier === "enterprise" && customAmount) {
        const customAmountNum = Number.parseInt(customAmount)
        if (!validateCustomAmount(customAmount)) {
          toast({
            title: "Invalid Amount",
            description: "Enterprise tier requires minimum ₦150,000 annually",
            variant: "destructive",
          })
          setIsProcessing(false)
          return
        }
        amount = customAmountNum
      } else {
        amount = tierPrices[selectedTier as keyof typeof tierPrices][billingInterval as keyof typeof tierPrices.pro]
      }

      // Initialize payment with Paystack
      const response = await fetch("/api/membership/payment/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: profile.email,
          amount: amount * 100, // Convert to kobo
          tier: selectedTier,
          billing_interval: selectedTier === "enterprise" && customAmount ? "custom" : billingInterval,
          custom_amount: selectedTier === "enterprise" && customAmount ? Number.parseInt(customAmount) : null,
          callback_url: `${window.location.origin}/premium/success`,
          metadata: {
            user_id: profile.id,
            tier: selectedTier,
            billing_interval: billingInterval,
            upgrade_type: "membership_subscription",
          },
        }),
      })

      const data = await response.json()

      if (data.success && data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.authorization_url
      } else {
        throw new Error(data.message || "Payment initialization failed")
      }
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="font-street text-4xl md:text-6xl text-gradient mb-4">JOIN THE CIRCLE</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get closer to the culture. Unlock exclusive content, early access, and VIP experiences.
          </p>
        </motion.div>

        {/* Animated Tier Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <AnimatedTierCards onUpgrade={handleTierUpgrade} />
        </motion.div>

        {selectedTier && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-6 text-center">
                  Complete Your {selectedTier === "pro" ? "Pro" : "Enterprise"} Upgrade
                </h3>

                {selectedTier === "enterprise" ? (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-medium">Payment Option</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <Button
                          variant={customAmount ? "outline" : "default"}
                          onClick={() => setCustomAmount("")}
                          className="h-12"
                        >
                          Standard Pricing
                        </Button>
                        <Button
                          variant={customAmount ? "default" : "outline"}
                          onClick={() => setCustomAmount("150000")}
                          className="h-12"
                        >
                          Custom Amount
                        </Button>
                      </div>
                    </div>

                    {customAmount ? (
                      <div>
                        <Label htmlFor="custom-amount" className="text-base font-medium">
                          Custom Annual Amount (Minimum ₦150,000)
                        </Label>
                        <Input
                          id="custom-amount"
                          type="number"
                          min="150000"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="Enter amount (minimum 150,000)"
                          className="mt-2 h-12 text-lg"
                        />
                        {customAmount && !validateCustomAmount(customAmount) && (
                          <p className="text-red-500 text-sm mt-1">Minimum amount is ₦150,000 for Enterprise tier</p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <Label className="text-base font-medium">Billing Interval</Label>
                        <div className="grid grid-cols-3 gap-4 mt-2">
                          {Object.entries(tierPrices.enterprise).map(([interval, price]) => (
                            <Button
                              key={interval}
                              variant={billingInterval === interval ? "default" : "outline"}
                              onClick={() => setBillingInterval(interval)}
                              className="h-16 flex flex-col"
                            >
                              <span className="capitalize font-medium">{interval}</span>
                              <span className="text-sm">₦{price.toLocaleString()}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <Label className="text-base font-medium">Billing Interval</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      {Object.entries(tierPrices.pro).map(([interval, price]) => (
                        <Button
                          key={interval}
                          variant={billingInterval === interval ? "default" : "outline"}
                          onClick={() => setBillingInterval(interval)}
                          className="h-16 flex flex-col"
                        >
                          <span className="capitalize font-medium">{interval}</span>
                          <span className="text-sm">₦{price.toLocaleString()}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span>Total Amount:</span>
                    <span className="text-2xl font-bold">
                      ₦
                      {(selectedTier === "enterprise" && customAmount
                        ? Number.parseInt(customAmount) || 0
                        : tierPrices[selectedTier as keyof typeof tierPrices][
                            billingInterval as keyof typeof tierPrices.pro
                          ]
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Includes {selectedTier === "pro" ? "1,000" : "12,000"} bonus coins monthly
                  </div>
                </div>

                <Button
                  onClick={handlePaymentWithPage}
                  disabled={
                    isProcessing ||
                    (selectedTier === "enterprise" && customAmount && !validateCustomAmount(customAmount))
                  }
                  className="w-full h-12 text-lg font-semibold mt-6"
                >
                  {isProcessing ? "Processing..." : "Proceed to Payment"}
                  <CreditCard className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tier Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <TierComparisonTable />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 border-orange-500/20">
              <CardContent className="p-8 text-center">
                <Zap className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">Secure Payment with Paystack</h3>
                <p className="text-muted-foreground mb-6">
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

            <Card className="bg-gradient-to-r from-blue-500/10 to-green-500/10 border-blue-500/20">
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">Payment Options</h3>
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-green-500" />
                    <span>Redirect to secure Paystack page</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    <span>All major cards accepted</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-orange-500" />
                    <span>Instant membership activation</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  No webhook setup required - payments verified automatically
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
