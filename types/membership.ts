// TypeScript type definitions for the membership system

export type MembershipTierCode = "FREE" | "PRO" | "ENT"
export type BillingInterval = "monthly" | "quarterly" | "annually"
export type PaymentStatus = "pending" | "completed" | "failed" | "cancelled"
export type MembershipStatus = "active" | "expired" | "cancelled"
export type WalletTransactionType = "credit" | "debit"

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
  created_at: string
  updated_at: string
}

export interface UserMembership {
  id: string
  user_id: string
  tier_code: MembershipTierCode
  started_at: string
  expires_at: string | null
  status: MembershipStatus
  months_purchased: number
  created_at: string
  updated_at: string
}

export interface Wallet {
  id: string
  user_id: string
  balance_coins: number
  created_at: string
  updated_at: string
}

export interface WalletTransaction {
  id: string
  wallet_id: string
  type: WalletTransactionType
  amount_coins: number
  reason: string
  ref_id: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface Payment {
  id: string
  user_id: string
  tier_code: MembershipTierCode
  interval: BillingInterval | null
  amount_ngn: number
  provider: string
  provider_ref: string
  status: PaymentStatus
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface MembershipPurchaseRequest {
  tier_code: MembershipTierCode
  interval: BillingInterval
  amount_ngn: number
  payment_method: "paystack"
  redirect_url?: string
}

export interface PaystackInitializeResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export interface BadgeConfig {
  label: string
  color: string
  bgColor: string
  textColor: string
  borderColor: string
}

export interface MembershipBenefit {
  id: string
  tier_code: MembershipTierCode
  benefit_type: string
  benefit_value: string | number
  description: string
  is_active: boolean
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface MembershipApiResponse extends ApiResponse {
  data?: {
    membership: UserMembership
    tier: MembershipTier
    wallet: Wallet
  }
}

export interface WalletApiResponse extends ApiResponse {
  data?: {
    balance_coins: number
    recent_transactions: WalletTransaction[]
  }
}

export interface PaymentInitResponse extends ApiResponse {
  data?: {
    payment_id: string
    authorization_url: string
    reference: string
  }
}
