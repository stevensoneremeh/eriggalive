"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Crown, Zap, CreditCard, CheckCircle, Coins, Calendar, Gift } from "lucide-react"
import { PaystackIntegration } from "@/components/paystack/paystack-integration"

interface MembershipTier {
  id: string
  name: string
  slug: string
  price_monthly: number
  price_yearly?: number
  features: string[]
  max_tickets_per_event: number
  early_access_hours: number
  discount_percentage: number
  is_active: boolean
}

interface MembershipUpgradeModalProps {
  tier: MembershipTier | null
  isOpen: boolean
  onClose: () => void
  userEmail?: string
  onUpgradeSuccess: (membership: any) => void
  onUpgradeError: (error: string) => void
}

export function MembershipUpgradeModal({
  tier,
  isOpen,
  onClose,
  userEmail,
  onUpgradeSuccess,
  onUpgradeError,
}: MembershipUpgradeModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")
  const [isProcessing, setIsProcessing] = useState(false)
  const [upgradeStep, setUpgradeStep] = useState<"select" | "processing" | "success">("select")

  if (!tier) return null

  const monthlyPrice = Math.floor(tier.price_monthly / 100)
  const yearlyPrice = tier.price_yearly ? Math.floor(tier.price_yearly / 100) : monthlyPrice * 12
  const yearlyDiscount = tier.price_yearly ? Math.round((1 - tier.price_yearly / (tier.price_monthly * 12)) * 100) : 0

  const selectedPrice = billingPeriod === "yearly" ? yearlyPrice : monthlyPrice
  const bonusCoins = billingPeriod === "yearly" ? 12000 : 1000 // 1000 coins per month

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price)
  }

  const handlePaystackSuccess = async (reference: string) => {
    setIsProcessing(true)
    setUpgradeStep("processing")

    try {
      const response = await fetch("/api/membership/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tierSlug: tier.slug,
          reference,
          amount: selectedPrice,
          billingPeriod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Subscription failed")
      }

      setUpgradeStep("success")
      onUpgradeSuccess(data.membership)

      // Close modal after 3 seconds
      setTimeout(() => {
        onClose()
        setUpgradeStep("select")
      }, 3000)
    } catch (error) {
      console.error("Subscription error:", error)
      onUpgradeError(error instanceof Error ? error.message : "Subscription failed")
      setUpgradeStep("select")
    } finally {
      setIsProcessing(false)
    }
  }

  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case "pro":
        return Crown
      case "enterprise":
        return Zap
      default:
        return Crown
    }
  }

  const TierIcon = getTierIcon(tier.name)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Upgrade to {tier.name}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {upgradeStep === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Tier Overview */}
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <TierIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{tier.name} Membership</h3>
                      <p className="text-slate-400">Unlock premium features and exclusive content</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{tier.max_tickets_per_event}</div>
                      <div className="text-slate-400">Tickets per event</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{tier.early_access_hours}h</div>
                      <div className="text-slate-400">Early access</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{tier.discount_percentage}%</div>
                      <div className="text-slate-400">Discount</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">{bonusCoins.toLocaleString()}</div>
                      <div className="text-slate-400">Bonus coins</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Period Selection */}
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Choose Billing Period</h4>

                  <RadioGroup
                    value={billingPeriod}
                    onValueChange={(value) => setBillingPeriod(value as "monthly" | "yearly")}
                  >
                    {/* Monthly */}
                    <div className="flex items-center space-x-3 p-4 rounded-lg border border-slate-600 hover:border-purple-500 transition-colors">
                      <RadioGroupItem value="monthly" id="monthly" />
                      <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="font-medium">Monthly</p>
                              <p className="text-sm text-slate-400">Billed monthly, cancel anytime</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{formatPrice(monthlyPrice)}</p>
                            <p className="text-sm text-slate-400">per month</p>
                          </div>
                        </div>
                      </Label>
                    </div>

                    {/* Yearly */}
                    {tier.price_yearly && (
                      <div className="flex items-center space-x-3 p-4 rounded-lg border border-slate-600 hover:border-blue-500 transition-colors">
                        <RadioGroupItem value="yearly" id="yearly" />
                        <Label htmlFor="yearly" className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-5 h-5 text-blue-400" />
                              <div>
                                <p className="font-medium">Yearly</p>
                                <p className="text-sm text-slate-400">Save {yearlyDiscount}% with annual billing</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">{formatPrice(yearlyPrice)}</p>
                              <p className="text-sm text-slate-400">per year</p>
                              {yearlyDiscount > 0 && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  Save {yearlyDiscount}%
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Label>
                      </div>
                    )}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Features List */}
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4">What's Included</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-sm text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Bonus Coins Info */}
              <Card className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 border-orange-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Gift className="w-6 h-6 text-orange-400" />
                    <h4 className="text-lg font-semibold">Bonus Coins Included!</h4>
                  </div>
                  <p className="text-slate-300 mb-2">
                    Get <strong className="text-orange-400">{bonusCoins.toLocaleString()} Erigga Coins</strong> as a
                    welcome bonus
                  </p>
                  <p className="text-sm text-slate-400">
                    Use coins for exclusive content, merchandise, and special events
                  </p>
                </CardContent>
              </Card>

              {/* Purchase Summary */}
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Order Summary</h4>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-300">{tier.name} Membership</span>
                      <span className="font-medium">{formatPrice(selectedPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Billing Period</span>
                      <span className="font-medium capitalize">{billingPeriod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Bonus Coins</span>
                      <span className="font-medium text-orange-400">{bonusCoins.toLocaleString()} coins</span>
                    </div>
                    <Separator className="bg-slate-600" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-purple-400">{formatPrice(selectedPrice)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                  Cancel
                </Button>

                {userEmail ? (
                  <PaystackIntegration
                    amount={selectedPrice}
                    email={userEmail}
                    metadata={{
                      tier_slug: tier.slug,
                      tier_name: tier.name,
                      billing_period: billingPeriod,
                      subscription_type: "membership",
                    }}
                    onSuccess={handlePaystackSuccess}
                    onError={onUpgradeError}
                  >
                    <Button
                      className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90"
                      disabled={isProcessing}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Subscribe Now
                    </Button>
                  </PaystackIntegration>
                ) : (
                  <Button disabled className="flex-1 bg-gray-600">
                    Login Required
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {upgradeStep === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-6"
              />
              <h3 className="text-xl font-semibold mb-2">Processing Your Subscription</h3>
              <p className="text-slate-400">Please wait while we activate your membership...</p>
            </motion.div>
          )}

          {upgradeStep === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2 text-green-400">Welcome to {tier.name}!</h3>
              <p className="text-slate-400 mb-4">Your membership has been activated successfully.</p>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <Coins className="w-4 h-4" />
                <span>{bonusCoins.toLocaleString()} bonus coins added to your wallet</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
