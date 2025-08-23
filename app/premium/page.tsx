"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedTierCards } from "@/components/tier-system/animated-tier-cards"
import { TierComparisonTable } from "@/components/tier-system/tier-comparison-table"
import { PaystackIntegration } from "@/components/paystack/paystack-integration"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Zap } from "lucide-react"

export default function PremiumPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [selectedTier, setSelectedTier] = useState<string | null>(null)

  const tierPrices = {
    pro: 2500,
    enterprise: 10000,
  }

  const handleTierUpgrade = (tierId: string) => {
    setSelectedTier(tierId)
  }

  const handlePaymentSuccess = async (reference: string) => {
    try {
      // Here you would call your API to upgrade the user's tier
      const response = await fetch("/api/tier/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          reference,
          tier: selectedTier,
          amount: tierPrices[selectedTier as keyof typeof tierPrices],
        }),
      })

      if (response.ok) {
        toast({
          title: "Upgrade Successful!",
          description: `You've been upgraded to ${selectedTier} tier`,
        })
        // Refresh user data
        window.location.reload()
      } else {
        throw new Error("Upgrade failed")
      }
    } catch (error) {
      toast({
        title: "Upgrade Failed",
        description: "Please contact support if payment was deducted",
        variant: "destructive",
      })
    }
    setSelectedTier(null)
  }

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    })
    setSelectedTier(null)
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

        {/* Tier Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <TierComparisonTable />
        </motion.div>

        {/* Payment Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 border-orange-500/20">
            <CardContent className="p-8 text-center">
              <Zap className="h-12 w-12 text-orange-500 mx-auto mb-4" />
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
        </motion.div>

        {/* Hidden Paystack Integration */}
        {selectedTier && profile?.email && (
          <PaystackIntegration
            amount={tierPrices[selectedTier as keyof typeof tierPrices]}
            email={profile.email}
            metadata={{
              tier: selectedTier,
              user_id: profile.id,
              upgrade_type: "tier_subscription",
            }}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onClose={() => setSelectedTier(null)}
          >
            <div />
          </PaystackIntegration>
        )}
      </div>
    </div>
  )
}
