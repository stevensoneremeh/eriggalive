"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Crown, Zap, ArrowRight, Sparkles } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface TierPlan {
  id: string
  name: string
  price: number
  period: string
  icon: React.ComponentType<any>
  color: string
  bgGradient: string
  borderColor: string
  popular?: boolean
  features: string[]
  coinBonus?: number
  description: string
}

const tierPlans: TierPlan[] = [
  {
    id: "erigga_citizen",
    name: "Erigga Citizen",
    price: 0,
    period: "forever",
    icon: Star,
    color: "text-gray-600",
    bgGradient: "from-gray-50 to-gray-100",
    borderColor: "border-gray-200",
    description: "Perfect for getting started",
    features: [
      "Access to community feed",
      "Basic profile customization",
      "Public content access",
      "Standard support",
      "Limited vault access",
    ],
  },
  {
    id: "erigga_indigen",
    name: "Erigga Indigen",
    price: 5000,
    period: "/month",
    icon: Crown,
    color: "text-blue-600",
    bgGradient: "from-blue-50 to-blue-100",
    borderColor: "border-blue-300",
    popular: true,
    coinBonus: 1000,
    description: "Most popular choice for fans",
    features: [
      "Everything in Erigga Citizen",
      "Early access to new drops",
      "Exclusive behind-the-scenes content",
      "15% discount on merch",
      "Priority event tickets",
      "Pro profile badge",
      "Premium vault access",
      "Monthly exclusive freestyles",
      "Advanced community features",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 15000,
    period: "/month",
    icon: Zap,
    color: "text-purple-600",
    bgGradient: "from-purple-50 to-purple-100",
    borderColor: "border-purple-300",
    coinBonus: 3000,
    description: "Ultimate fan experience",
    features: [
      "Everything in Erigga Indigen",
      "VIP access to all events",
      "30% discount on all purchases",
      "Backstage access at events",
      "Direct contact with Erigga",
      "Custom Enterprise 'E' badge",
      "Full vault access",
      "Quarterly private sessions",
      "Input on upcoming releases",
      "Limited edition merchandise",
      "Priority customer support",
      "Exclusive meet & greet opportunities",
    ],
  },
]

interface AnimatedTierCardsProps {
  onUpgrade?: (tierId: string) => void
}

export function AnimatedTierCards({ onUpgrade }: AnimatedTierCardsProps) {
  const { profile } = useAuth()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  const currentTier = profile?.tier || "erigga_citizen"

  const cardVariants = {
    initial: { scale: 1, y: 0 },
    hover: {
      scale: 1.05,
      y: -10,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
    tap: { scale: 0.98 },
  }

  const featureVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
      },
    }),
  }

  const badgeVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.2,
      },
    },
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
      {tierPlans.map((plan, index) => {
        const Icon = plan.icon
        const isCurrentTier = currentTier === plan.id
        const canUpgrade =
          !isCurrentTier &&
          ((currentTier === "erigga_citizen" && (plan.id === "erigga_indigen" || plan.id === "enterprise")) ||
            (currentTier === "erigga_indigen" && plan.id === "enterprise"))

        return (
          <motion.div
            key={plan.id}
            variants={cardVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onHoverStart={() => setHoveredCard(plan.id)}
            onHoverEnd={() => setHoveredCard(null)}
            className="relative"
          >
            <Card
              className={`
              relative overflow-hidden h-full cursor-pointer
              bg-gradient-to-br ${plan.bgGradient}
              border-2 ${plan.borderColor}
              ${hoveredCard === plan.id ? "shadow-2xl" : "shadow-lg"}
              ${plan.popular ? "ring-2 ring-orange-400 ring-offset-2" : ""}
              transition-all duration-300
            `}
            >
              {/* Popular Badge */}
              <AnimatePresence>
                {plan.popular && (
                  <motion.div
                    variants={badgeVariants}
                    initial="initial"
                    animate="animate"
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
                  >
                    <Badge className="bg-orange-500 text-white font-bold px-4 py-2 text-sm">
                      <Sparkles className="w-3 h-3 mr-1" />
                      MOST POPULAR
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>

              <CardHeader className="text-center pb-4 pt-8">
                <motion.div
                  className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${plan.bgGradient} border-2 ${plan.borderColor} flex items-center justify-center`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Icon className={`h-10 w-10 ${plan.color}`} />
                </motion.div>

                <CardTitle className={`text-3xl font-bold ${plan.color} mb-2`}>{plan.name}</CardTitle>

                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

                <div className="text-center">
                  <motion.div
                    className="text-4xl font-bold text-foreground"
                    animate={{ scale: hoveredCard === plan.id ? 1.1 : 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {plan.price === 0 ? "Free" : `₦${plan.price.toLocaleString()}`}
                  </motion.div>
                  {plan.period && <div className="text-sm text-muted-foreground">{plan.period}</div>}
                  {plan.coinBonus && (
                    <motion.div
                      className="text-sm text-green-600 font-medium mt-1"
                      animate={{ opacity: hoveredCard === plan.id ? 1 : 0.7 }}
                    >
                      +{plan.coinBonus} bonus coins
                    </motion.div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="px-6 pb-8">
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <motion.div
                      key={featureIndex}
                      custom={featureIndex}
                      variants={featureVariants}
                      initial="hidden"
                      animate={hoveredCard === plan.id ? "visible" : "hidden"}
                      className="flex items-center gap-3"
                    >
                      <motion.div className="flex-shrink-0" whileHover={{ scale: 1.2 }} transition={{ duration: 0.2 }}>
                        <Check className="h-4 w-4 text-green-500" />
                      </motion.div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    className={`
                      w-full font-semibold py-3 rounded-lg
                      ${
                        isCurrentTier
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : canUpgrade
                            ? `bg-gradient-to-r ${plan.bgGradient} ${plan.color} border-2 ${plan.borderColor} hover:shadow-lg`
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }
                      transition-all duration-300
                    `}
                    disabled={!canUpgrade && !isCurrentTier}
                    onClick={() => canUpgrade && onUpgrade?.(plan.id)}
                  >
                    {isCurrentTier ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Current Plan
                      </>
                    ) : canUpgrade ? (
                      <>
                        Upgrade Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      "Not Available"
                    )}
                  </Button>
                </motion.div>
              </CardContent>

              {/* Animated Background Effect */}
              <motion.div
                className="absolute inset-0 opacity-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"
                animate={{ opacity: hoveredCard === plan.id ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
