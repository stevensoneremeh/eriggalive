// Membership tier logic and utilities
import { z } from "zod"

// Types and interfaces
export type MembershipTierCode = "FREE" | "PRO" | "ENT"
export type BillingInterval = "monthly" | "quarterly" | "annually"

export interface MembershipTier {
  id: string
  code: MembershipTierCode
  name: string
  description: string
  is_paid: boolean
  billing_options: BillingInterval[]
  badge_label: string
  badge_color: string
  dashboard_theme: string
}

export interface UserMembership {
  id: string
  user_id: string
  tier_code: MembershipTierCode
  started_at: string
  expires_at: string | null
  status: "active" | "expired" | "cancelled"
  months_purchased: number
}

export interface MembershipPricing {
  tier_code: MembershipTierCode
  interval: BillingInterval
  amount_ngn: number
  original_price?: number
  discount_amount?: number
  coins_bonus: number
  months: number
}

// Pricing configuration
export const MEMBERSHIP_PRICING: Record<MembershipTierCode, Record<BillingInterval, MembershipPricing>> = {
  FREE: {} as any, // Free tier has no pricing
  PRO: {
    monthly: {
      tier_code: "PRO",
      interval: "monthly",
      amount_ngn: 9900,
      original_price: 10000,
      discount_amount: 100,
      coins_bonus: 1000,
      months: 1,
    },
    quarterly: {
      tier_code: "PRO",
      interval: "quarterly",
      amount_ngn: 29700, // 9900 × 3 - 300 discount
      original_price: 30000,
      discount_amount: 300,
      coins_bonus: 3000,
      months: 3,
    },
    annually: {
      tier_code: "PRO",
      interval: "annually",
      amount_ngn: 118800, // 9900 × 12 - 1000 discount
      original_price: 120000,
      discount_amount: 1200,
      coins_bonus: 12000,
      months: 12,
    },
  },
  ENT: {
    annually: {
      tier_code: "ENT",
      interval: "annually",
      amount_ngn: 119900, // Discounted price ending in "9"
      original_price: 150000,
      discount_amount: 30100,
      coins_bonus: 12000,
      months: 12,
    },
  } as any, // Enterprise only has annual billing
}

// Validation schemas
export const membershipTierSchema = z.object({
  tier_code: z.enum(["FREE", "PRO", "ENT"]),
  interval: z.enum(["monthly", "quarterly", "annually"]).optional(),
})

export const membershipPurchaseSchema = z.object({
  tier_code: z.enum(["PRO", "ENT"]),
  interval: z.enum(["monthly", "quarterly", "annually"]),
  amount_ngn: z.number().positive(),
  payment_method: z.enum(["paystack"]),
})

// Utility functions
export const getMembershipPricing = (
  tierCode: MembershipTierCode,
  interval: BillingInterval,
): MembershipPricing | null => {
  if (tierCode === "FREE") return null

  const tierPricing = MEMBERSHIP_PRICING[tierCode]
  if (!tierPricing || !tierPricing[interval]) return null

  return tierPricing[interval]
}

export const calculateCoinsBonus = (tierCode: MembershipTierCode, months: number): number => {
  if (tierCode === "FREE") return 0
  return months * 1000 // 1000 coins per month for paid tiers
}

export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount)
}

export const getBadgeConfig = (tierCode: MembershipTierCode) => {
  const configs = {
    FREE: {
      label: "ECor Erigga Citizen",
      color: "#6B7280",
      bgColor: "bg-gray-100",
      textColor: "text-gray-700",
      borderColor: "border-gray-300",
    },
    PRO: {
      label: "Erigga Indigen",
      color: "#4B9CD3",
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
      borderColor: "border-blue-300",
    },
    ENT: {
      label: "E",
      color: "#FFD700",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-800",
      borderColor: "border-yellow-400",
    },
  }

  return configs[tierCode]
}

export const getDashboardTheme = (tierCode: MembershipTierCode): string => {
  return tierCode === "ENT" ? "enterprise" : "default"
}

export const isMembershipActive = (membership: UserMembership | null): boolean => {
  if (!membership) return false
  if (membership.status !== "active") return false
  if (membership.tier_code === "FREE") return true
  if (!membership.expires_at) return false

  return new Date(membership.expires_at) > new Date()
}

export const getMembershipExpiryDate = (
  tierCode: MembershipTierCode,
  interval: BillingInterval,
  startDate: Date = new Date(),
): Date | null => {
  if (tierCode === "FREE") return null

  const pricing = getMembershipPricing(tierCode, interval)
  if (!pricing) return null

  const expiryDate = new Date(startDate)
  expiryDate.setMonth(expiryDate.getMonth() + pricing.months)

  return expiryDate
}

export const getAvailableBillingOptions = (tierCode: MembershipTierCode): BillingInterval[] => {
  if (tierCode === "FREE") return []
  if (tierCode === "PRO") return ["monthly", "quarterly", "annually"]
  if (tierCode === "ENT") return ["annually"]
  return []
}

export const validateMembershipPurchase = (
  tierCode: MembershipTierCode,
  interval: BillingInterval,
  amount: number,
): { isValid: boolean; error?: string } => {
  const pricing = getMembershipPricing(tierCode, interval)

  if (!pricing) {
    return { isValid: false, error: "Invalid tier or billing interval" }
  }

  if (amount !== pricing.amount_ngn) {
    return { isValid: false, error: "Invalid payment amount" }
  }

  return { isValid: true }
}

// Feature flags
export const FEATURE_FLAGS = {
  MEMBERSHIP_TIERS_V1: process.env.FEATURE_MEMBERSHIP_TIERS_V1 === "true",
}

export const isMembershipFeatureEnabled = (): boolean => {
  return FEATURE_FLAGS.MEMBERSHIP_TIERS_V1
}
