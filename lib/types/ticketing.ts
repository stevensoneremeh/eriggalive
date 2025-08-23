export interface Event {
  id: number
  slug?: string
  title: string
  description?: string
  starts_at: string
  venue: string
  capacity: number
  status: "draft" | "active" | "archived"
  cover_image_url?: string
  created_at: string
  updated_at: string
}

export interface MembershipTier {
  id: string
  code: "FREE" | "PRO" | "ENT"
  name: string
  description?: string
  is_paid: boolean
  plan_codes: Record<string, any>
  min_amount_ngn?: number
  billing_cycles: Record<string, boolean>
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  user_id: string
  context: "ticket" | "membership"
  context_id?: string
  provider: "paystack" | "coin"
  provider_ref?: string
  amount_ngn: number
  currency: string
  status: "pending" | "paid" | "failed" | "refunded"
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: string
  event_id: number
  user_id: string
  purchase_id?: string
  status: "unused" | "admitted" | "refunded" | "invalid"
  qr_token_hash: string
  qr_expires_at?: string
  admitted_at?: string
  created_at: string
  updated_at: string
  event?: Event
  payment?: Payment
}

export interface Membership {
  id: string
  user_id: string
  tier_code: string
  started_at: string
  expires_at?: string
  status: "active" | "expired" | "canceled"
  total_months_purchased: number
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  tier_code: string
  interval: "monthly" | "quarterly" | "yearly" | "annual_custom"
  months_purchased: number
  amount_paid_ngn: number
  status: "pending" | "active" | "failed" | "canceled"
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

export interface WalletLedgerEntry {
  id: string
  wallet_id: string
  type: "credit" | "debit"
  amount_coins: number
  reason: "membership_bonus" | "ticket_purchase" | "admin_adjustment" | "refund"
  ref_id?: string
  created_at: string
}

export interface ScanLog {
  id: string
  ticket_id: string
  admin_user_id?: string
  scan_result: "admitted" | "duplicate" | "invalid"
  device_fingerprint?: string
  location_hint?: string
  scanned_at: string
  created_at: string
}

export interface Settings {
  key: string
  value_json: Record<string, any>
  created_at: string
  updated_at: string
}

// Request/Response types for API endpoints
export interface TicketPurchaseRequest {
  event_id: number
  method: "paystack" | "coin"
}

export interface PaymentInitiateRequest {
  context: "ticket" | "membership"
  context_id?: string
  amount_ngn?: number
  plan_code?: string
  interval?: string
  tier_code?: string
  custom_amount?: number
}

export interface CheckinRequest {
  token: string
  device_fingerprint?: string
  gate?: string
}

export interface CheckinResponse {
  result: "admit" | "reject"
  ticket_id: string
  user_masked: string
  event: Partial<Event>
  warnings?: string[]
  previous_status?: string
}
