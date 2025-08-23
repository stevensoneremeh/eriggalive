"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Crown, Star, Zap, Calendar, Gift, ArrowRight } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface MembershipStatusProps {
  onUpgrade?: () => void
}

const TIER_INFO = {
  free: {
    name: "Free",
    icon: Star,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
    benefits: ["Community access", "Basic profile", "Public content"],
  },
  pro: {
    name: "Pro",
    icon: Crown,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
    benefits: ["Everything in Free", "Early access", "15% discount", "Premium content"],
  },
  enterprise: {
    name: "Enterprise",
    icon: Zap,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-300",
    benefits: ["Everything in Pro", "VIP access", "30% discount", "Backstage access"],
  },
}

export function MembershipStatus({ onUpgrade }: MembershipStatusProps) {
  const { profile } = useAuth()
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [progressPercentage, setProgressPercentage] = useState(0)

  useEffect(() => {
    if (profile?.membership_expires_at) {
      const expiryDate = new Date(profile.membership_expires_at)
      const now = new Date()
      const diffTime = expiryDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      setDaysRemaining(diffDays)

      // Calculate progress (assuming 30 days for monthly, 365 for yearly)
      const totalDays = diffDays > 300 ? 365 : 30
      const elapsed = totalDays - diffDays
      const percentage = Math.max(0, Math.min(100, (elapsed / totalDays) * 100))
      setProgressPercentage(percentage)
    }
  }, [profile?.membership_expires_at])

  const currentTier = profile?.membership_tier || "free"
  const tierInfo = TIER_INFO[currentTier as keyof typeof TIER_INFO]
  const TierIcon = tierInfo.icon

  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7
  const isExpired = daysRemaining !== null && daysRemaining <= 0

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Current Membership Card */}
      <Card className={`${tierInfo.borderColor} border-2`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${tierInfo.bgColor}`}>
                <TierIcon className={`h-6 w-6 ${tierInfo.color}`} />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {tierInfo.name} Member
                  <Badge className={tierInfo.color}>{currentTier.toUpperCase()}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
            {currentTier !== "enterprise" && (
              <Button onClick={onUpgrade} size="sm">
                <ArrowRight className="h-4 w-4 mr-1" />
                Upgrade
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Membership Expiry */}
          {profile?.membership_expires_at && currentTier !== "free" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Membership Status
                </span>
                <span
                  className={`font-medium ${
                    isExpired ? "text-red-600" : isExpiringSoon ? "text-orange-600" : "text-green-600"
                  }`}
                >
                  {isExpired
                    ? "Expired"
                    : isExpiringSoon
                      ? `${daysRemaining} days left`
                      : `${daysRemaining} days remaining`}
                </span>
              </div>
              <Progress
                value={progressPercentage}
                className={`h-2 ${isExpired ? "bg-red-100" : isExpiringSoon ? "bg-orange-100" : "bg-green-100"}`}
              />
              <p className="text-xs text-muted-foreground">
                Expires on {new Date(profile.membership_expires_at).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Benefits */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-1">
              <Gift className="h-4 w-4" />
              Your Benefits
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {tierInfo.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          {/* Renewal Notice */}
          {isExpiringSoon && !isExpired && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
            >
              <p className="text-sm text-orange-800">
                Your membership expires soon! Renew now to continue enjoying premium benefits.
              </p>
              <Button size="sm" className="mt-2" onClick={onUpgrade}>
                Renew Membership
              </Button>
            </motion.div>
          )}

          {/* Expired Notice */}
          {isExpired && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-sm text-red-800">
                Your membership has expired. Upgrade to restore your premium benefits.
              </p>
              <Button size="sm" className="mt-2" onClick={onUpgrade}>
                Reactivate Membership
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Suggestions */}
      {currentTier !== "enterprise" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Unlock More Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentTier === "free" && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Upgrade to Pro</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Get early access, premium content, and 15% discount on all purchases.
                  </p>
                </div>
              )}

              {(currentTier === "free" || currentTier === "pro") && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-purple-800">Upgrade to Enterprise</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    VIP access, backstage passes, 30% discount, and direct artist contact.
                  </p>
                </div>
              )}
            </div>

            <Button className="w-full mt-4" onClick={onUpgrade}>
              View Upgrade Options
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
