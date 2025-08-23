// Payment service for handling payment operations
import { createClient } from "@/lib/supabase/server"
import type { Payment } from "@/lib/types/ticketing"

export class PaymentService {
  private supabase = createClient()

  // Get payment by reference
  async getPaymentByReference(reference: string): Promise<Payment | null> {
    const { data: payment } = await this.supabase.from("payments").select("*").eq("provider_ref", reference).single()

    return payment
  }

  // Get user payments
  async getUserPayments(userId: string, limit = 10): Promise<Payment[]> {
    const { data: payments } = await this.supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    return payments || []
  }

  // Verify payment with Paystack
  async verifyPaystackPayment(reference: string): Promise<{
    success: boolean
    data?: any
    error?: string
  }> {
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        return { success: false, error: `Paystack API error: ${response.status}` }
      }

      const result = await response.json()
      return { success: result.status, data: result.data, error: result.message }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  // Process coin payment (debit wallet and create payment record)
  async processCoinPayment(
    userId: string,
    context: "ticket" | "membership",
    amount: number,
    contextId?: string,
    metadata: Record<string, any> = {},
  ): Promise<{ success: boolean; payment?: Payment; error?: string }> {
    try {
      // Check wallet balance
      const { data: wallet } = await this.supabase
        .from("wallets")
        .select("balance_coins")
        .eq("user_id", userId)
        .single()

      if (!wallet || wallet.balance_coins < amount) {
        return { success: false, error: "Insufficient coin balance" }
      }

      // Generate reference
      const reference = `coin_${context}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Create payment record
      const { data: payment, error: paymentError } = await this.supabase
        .from("payments")
        .insert({
          user_id: userId,
          context,
          context_id: contextId,
          provider: "coin",
          provider_ref: reference,
          amount_ngn: amount, // Store coin amount in NGN equivalent
          status: "paid", // Coin payments are immediately paid
          metadata: {
            ...metadata,
            coin_amount: amount,
            processed_at: new Date().toISOString(),
          },
        })
        .select()
        .single()

      if (paymentError) {
        return { success: false, error: "Failed to create payment record" }
      }

      // Debit wallet
      const { data: debitSuccess } = await this.supabase.rpc("debit_wallet", {
        p_user_id: userId,
        p_amount: amount,
        p_reason: context === "ticket" ? "ticket_purchase" : "membership_bonus",
        p_ref_id: payment.id,
      })

      if (!debitSuccess) {
        // Rollback payment record
        await this.supabase.from("payments").delete().eq("id", payment.id)
        return { success: false, error: "Failed to debit wallet" }
      }

      return { success: true, payment }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }
}

export const paymentService = new PaymentService()
