"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Star, Shield, Droplets, Loader2 } from "lucide-react"
import type { TierWithAccess } from "@/lib/tier-service"

interface TierCardProps {
  tier: TierWithAccess
  onUpgrade: (tierId: number, amount: number) => Promise<void>
  isProcessing: boolean
}

const tierIcons = {
  grassroot: Star,
  pioneer: Crown,
  elder: Shield,
  blood: Droplets,
}

const tierColors = {
  grassroot: {
    color: "text-gray-400",
    bgColor: "bg-gray-400/10",
    borderColor: "border-gray-400/20",
    buttonColor: "bg-gray-600 hover:bg-gray-700",
  },
  pioneer: {
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/40",
    buttonColor: "bg-orange-500 hover:bg-orange-600 text-black",
  },
  elder: {
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/40",
    buttonColor: "bg-yellow-500 hover:bg-yellow-600 text-black",
  },
  blood: {
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/40",
    buttonColor: "bg-red-500 hover:bg-red-600 text-white",
  },
}

export function TierCard({ tier, onUpgrade, isProcessing }: TierCardProps) {
  const [isUpgrading, setIsUpgrading] = useState(false)

  const Icon = tierIcons[tier.slug as keyof typeof tierIcons] || Star
  const colors = tierColors[tier.slug as keyof typeof tierColors] || tierColors.grassroot

  const handleUpgrade = async () => {
    if (isProcessing || isUpgrading || !tier.canUpgrade) return

    setIsUpgrading(true)
    try {
      await onUpgrade(tier.id, tier.price)
    } finally {
      setIsUpgrading(false)
    }
  }

  const getButtonText = () => {
    if (tier.isCurrentTier) return "Current Tier"
    if (tier.isLowerTier) return "Downgrade Not Available"
    if (tier.price === 0) return "Free Tier"
    return `Upgrade - ₦${tier.price.toLocaleString()}`
  }

  const isButtonDisabled = () => {
    return tier.isCurrentTier || tier.isLowerTier || isProcessing || isUpgrading
  }

  return (
    <Card
      className={`relative ${colors.bgColor} ${colors.borderColor} border-2 hover:scale-105 transition-all duration-300 ${
        tier.isCurrentTier ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
      }`}
    >
      {tier.isCurrentTier && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground font-bold px-4 py-1">ACTIVE</Badge>
        </div>
      )}

      {tier.rank === 1 && !tier.isCurrentTier && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-orange-500 text-black font-bold px-4 py-1">MOST POPULAR</Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <div className={`w-16 h-16 ${colors.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`h-8 w-8 ${colors.color}`} />
        </div>
        <CardTitle className={`text-2xl font-street ${colors.color}`}>{tier.name}</CardTitle>
        <div className="text-3xl font-bold">
          {tier.price === 0 ? "Free" : `₦${tier.price.toLocaleString()}`}
          {tier.price > 0 && <span className="text-lg text-muted-foreground">/month</span>}
        </div>
        {tier.description && <p className="text-sm text-muted-foreground mt-2">{tier.description}</p>}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          {tier.benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{benefit}</span>
            </div>
          ))}
        </div>

        <Button
          className={`w-full mt-6 ${colors.buttonColor} font-bold`}
          onClick={handleUpgrade}
          disabled={isButtonDisabled()}
        >
          {isUpgrading || isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            getButtonText()
          )}
        </Button>

        {tier.isLowerTier && (
          <p className="text-xs text-muted-foreground text-center">You already have a higher tier</p>
        )}
      </CardContent>
    </Card>
  )
}
