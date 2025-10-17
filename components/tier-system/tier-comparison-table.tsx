"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, Crown, Star, Zap } from "lucide-react"

const features = [
  { name: "Community Access", free: true, pro: true, enterprise: true },
  { name: "Basic Profile", free: true, pro: true, enterprise: true },
  { name: "Public Content", free: true, pro: true, enterprise: true },
  { name: "Exclusive Content", free: false, pro: true, enterprise: true },
  { name: "Early Music Access", free: false, pro: true, enterprise: true },
  { name: "Merch Discounts", free: false, pro: "10%", enterprise: "30%" },
  { name: "Event Priority", free: false, pro: true, enterprise: true },
  { name: "VIP Access", free: false, pro: false, enterprise: true },
  { name: "Backstage Access", free: false, pro: false, enterprise: true },
  { name: "Direct Artist Contact", free: false, pro: false, enterprise: true },
  { name: "Premium Badge", free: false, pro: true, enterprise: true },
  { name: "Vault Access", free: "Limited", pro: "Premium", enterprise: "Full" },
  { name: "Private Sessions", free: false, pro: false, enterprise: "Quarterly" },
  { name: "Limited Edition Merch", free: false, pro: false, enterprise: true },
]

const tiers = [
  { id: "free", name: "Free", icon: Star, color: "text-gray-600" },
  { id: "pro", name: "Pro", icon: Crown, color: "text-orange-600" },
  { id: "enterprise", name: "Enterprise", icon: Zap, color: "text-purple-600" },
]

export function TierComparisonTable() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  }

  const renderFeatureValue = (value: boolean | string, tierIndex: number) => {
    if (value === true) {
      return (
        <motion.div whileHover={{ scale: 1.2 }} transition={{ duration: 0.2 }}>
          <Check className="h-5 w-5 text-green-500 mx-auto" />
        </motion.div>
      )
    }

    if (value === false) {
      return (
        <motion.div whileHover={{ scale: 1.2 }} transition={{ duration: 0.2 }}>
          <X className="h-5 w-5 text-red-400 mx-auto" />
        </motion.div>
      )
    }

    return (
      <motion.span className="text-sm font-medium" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
        {value}
      </motion.span>
    )
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">Feature Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <motion.table className="w-full" variants={containerVariants} initial="hidden" animate="visible">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-4 px-4 font-semibold">Features</th>
                {tiers.map((tier) => {
                  const Icon = tier.icon
                  return (
                    <th key={tier.id} className="text-center py-4 px-4">
                      <motion.div
                        className="flex flex-col items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Icon className={`h-6 w-6 ${tier.color}`} />
                        <span className={`font-semibold ${tier.color}`}>{tier.name}</span>
                      </motion.div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <motion.tr
                  key={feature.name}
                  variants={rowVariants}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                >
                  <td className="py-4 px-4 font-medium text-gray-900">{feature.name}</td>
                  <td className="text-center py-4 px-4">{renderFeatureValue(feature.free, 0)}</td>
                  <td className="text-center py-4 px-4">{renderFeatureValue(feature.pro, 1)}</td>
                  <td className="text-center py-4 px-4">{renderFeatureValue(feature.enterprise, 2)}</td>
                </motion.tr>
              ))}
            </tbody>
          </motion.table>
        </div>
      </CardContent>
    </Card>
  )
}
