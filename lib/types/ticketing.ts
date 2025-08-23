// TypeScript types for the ticketing system
import { z } from "zod"

// Event types
export const EventStatusSchema = z.enum(["draft", "active", "archived"])
export const EventSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  starts_at: z.string().datetime(),
  venue: z.string(),
  capacity: z.number().int().min(0),
  status: EventStatusSchema,
  cover_image_url: z.string().nullable(),
  ticket_price_ngn: z.number().int().min(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// Payment types
export const PaymentContextSchema = z.enum(["ticket", "membership"])
export const PaymentProviderSchema = z.enum(["paystack", "coin"])
export const PaymentStatusSchema = z.enum(["pending", "paid", "failed", "refunded"])

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  context: PaymentContextSchema,
  context_id: z.string().uuid().nullable(),
  provider: PaymentProviderSchema,
  provider_ref: z.string().nullable(),
  amount_ngn: z.number().int(),
  currency: z.string().default("NGN"),
  status: PaymentStatusSchema,
  metadata: z.record(z.any()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// Ticket types
export const TicketStatusSchema = z.enum(["unused", "admitted", "refunded", "invalid"])
export const TicketSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  user_id: z.string().uuid(),
  purchase_id: z.string().uuid(),
  status: TicketStatusSchema,
  qr_token_hash: z.string(),
  qr_expires_at: z.string().datetime().nullable(),
  admitted_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// Membership types
export const MembershipTierCodeSchema = z.enum(["FREE", "PRO", "ENT"])
export const MembershipStatusSchema = z.enum(["active", "expired", "canceled"])

export const MembershipTierSchema = z.object({
  id: z.string().uuid(),
  code: MembershipTierCodeSchema,
  name: z.string(),
  description: z.string().nullable(),
  is_paid: z.boolean(),
  plan_codes: z.record(z.any()).default({}),
  min_amount_ngn: z.number().int().nullable(),
  billing_cycles: z.record(z.any()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const MembershipSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  tier_code: z.string(),
  started_at: z.string().datetime(),
  expires_at: z.string().datetime().nullable(),
  status: MembershipStatusSchema,
  total_months_purchased: z.number().int().default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// Wallet types
export const WalletLedgerTypeSchema = z.enum(["credit", "debit"])
export const WalletLedgerReasonSchema = z.enum(["membership_bonus", "ticket_purchase", "admin_adjustment", "refund"])

export const WalletSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  balance_coins: z.number().int().min(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const WalletLedgerSchema = z.object({
  id: z.string().uuid(),
  wallet_id: z.string().uuid(),
  type: WalletLedgerTypeSchema,
  amount_coins: z.number().int(),
  reason: WalletLedgerReasonSchema,
  ref_id: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
})

// Scan log types
export const ScanResultSchema = z.enum(["admitted", "duplicate", "invalid"])
export const ScanLogSchema = z.object({
  id: z.string().uuid(),
  ticket_id: z.string().uuid(),
  admin_user_id: z.string().uuid(),
  scan_result: ScanResultSchema,
  device_fingerprint: z.string().nullable(),
  location_hint: z.string().nullable(),
  scanned_at: z.string().datetime(),
  created_at: z.string().datetime(),
})

// API request/response schemas
export const TicketPurchaseRequestSchema = z.object({
  event_id: z.string().uuid(),
  method: z.enum(["paystack", "coin"]),
})

export const PaymentInitiateRequestSchema = z.object({
  context: PaymentContextSchema,
  context_id: z.string().uuid().optional(),
  amount_ngn: z.number().int().optional(),
  plan_code: z.string().optional(),
  interval: z.enum(["monthly", "quarterly", "yearly", "annual_custom"]).optional(),
  tier_code: MembershipTierCodeSchema.optional(),
  custom_amount: z.number().int().optional(),
})

export const CheckinRequestSchema = z.object({
  token: z.string(),
  device_fingerprint: z.string().optional(),
  gate: z.string().optional(),
})

export const CheckinResponseSchema = z.object({
  result: ScanResultSchema,
  ticket_id: z.string().uuid(),
  user_masked: z.string(),
  event: z.object({
    title: z.string(),
    venue: z.string(),
    starts_at: z.string().datetime(),
  }),
  previous_status: TicketStatusSchema,
  decision: z.enum(["admit", "reject"]),
  warnings: z.array(z.string()).default([]),
})

// Inferred types
export type Event = z.infer<typeof EventSchema>
export type Payment = z.infer<typeof PaymentSchema>
export type Ticket = z.infer<typeof TicketSchema>
export type MembershipTier = z.infer<typeof MembershipTierSchema>
export type Membership = z.infer<typeof MembershipSchema>
export type Wallet = z.infer<typeof WalletSchema>
export type WalletLedger = z.infer<typeof WalletLedgerSchema>
export type ScanLog = z.infer<typeof ScanLogSchema>

export type TicketPurchaseRequest = z.infer<typeof TicketPurchaseRequestSchema>
export type PaymentInitiateRequest = z.infer<typeof PaymentInitiateRequestSchema>
export type CheckinRequest = z.infer<typeof CheckinRequestSchema>
export type CheckinResponse = z.infer<typeof CheckinResponseSchema>
