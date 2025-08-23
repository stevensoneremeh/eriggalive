"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedTierCards } from "@/components/tier-system/animated-tier-cards"
import { TierComparisonTable } from "@/components/tier-system/tier-comparison-table"
import { MembershipUpgradeModal } from "@/components/membership/membership-upgrade-modal"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Zap } from "lucide-react"

const membershipTiers = {
  pro: {
    id: "pro-tier-id",
    name: "Pro",
    slug: "pro",
    price_monthly: 500000, // 5000 NGN in kobo
    price_yearly: 5000000, // 50000 NGN in kobo (save ~17%)
    features: [
      "Priority support",
      "Exclusive content",
      "Early ticket access",
      "10% discount on tickets",
      "Premium vault access",
      "Monthly exclusive freestyles",
      "Advanced community features",
    ],
    max_tickets_per_event: 2,
    early_access_hours: 24,
    discount_percentage: 10,
    is_active: true,
  },
  enterprise: {
    id: "enterprise-tier-id",
    name: "Enterprise",
    slug: "enterprise",
    price_monthly: 2000000, // 20000 NGN in kobo
    price_yearly: 20000000, // 200000 NGN in kobo (save ~17%)
    features: [
      "VIP support",
      "Backstage access",
      "Meet & greet opportunities",
      "20% discount on tickets",
      "Exclusive merchandise",
      "Full vault access",
      "Quarterly private sessions",
      "Input on upcoming releases",
      "Priority customer support",
    ],
    max_tickets_per_event: 5,
    early_access_hours: 48,
    discount_percentage: 20,
    is_active: true,
  },
}

export default function PremiumPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const handleTierUpgrade = (tierId: string) => {
    setSelectedTier(tierId)
    setShowUpgradeModal(true)
  }

  const handleUpgradeSuccess = async (membership: any) => {
    try {
      toast({
        title: "Upgrade Successful!",
        description: `Welcome to ${membership.tier_name}! ${membership.bonus_coins.toLocaleString()} bonus coins have been added to your wallet.`,
      })

      // Refresh user data
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error("Post-upgrade error:", error)
    }
    setShowUpgradeModal(false)
    setSelectedTier(null)
  }

  const handleUpgradeError = (error: string) => {
    toast({
      title: "Upgrade Failed",
      description: error,
      variant: "destructive",
    })
    setShowUpgradeModal(false)
    setSelectedTier(null)
  }

  const selectedTierData = selectedTier ? membershipTiers[selectedTier as keyof typeof membershipTiers] : null

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
                Erigga and the community. Get bonus Erigga Coins with every subscription!
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                <span>• Secure Payment</span>
                <span>• Cancel Anytime</span>
                <span>• Instant Access</span>
                <span>• Bonus Coins Included</span>
                <span>• 24/7 Support</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <MembershipUpgradeModal
          tier={selectedTierData}
          isOpen={showUpgradeModal}
          onClose={() => {
            setShowUpgradeModal(false)
            setSelectedTier(null)
          }}
          userEmail={profile?.email}
          onUpgradeSuccess={handleUpgradeSuccess}
          onUpgradeError={handleUpgradeError}
        />
      </div>
    </div>
  )
}
