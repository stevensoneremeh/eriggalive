"use client"

import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

export interface CoinTransaction {
  id?: string
  user_id: string
  amount: number
  transaction_type: "vote" | "post_reward" | "purchase" | "withdrawal" | "bonus"
  description: string
  metadata?: Record<string, any>
  created_at?: string
}

export class CoinManager {
  private supabase = createClient()

  async getUserBalance(userId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase.from("users").select("coins").eq("id", userId).single()

      if (error) throw error
      return data?.coins || 0
    } catch (error) {
      console.error("Error fetching user balance:", error)
      return 0
    }
  }

  async deductCoins(
    userId: string,
    amount: number,
    transaction: Omit<CoinTransaction, "user_id" | "amount">,
  ): Promise<boolean> {
    try {
      // Start transaction
      const { data: userData, error: userError } = await this.supabase
        .from("users")
        .select("coins")
        .eq("id", userId)
        .single()

      if (userError) throw userError

      const currentBalance = userData.coins || 0
      if (currentBalance < amount) {
        throw new Error("Insufficient balance")
      }

      // Update user balance
      const { error: updateError } = await this.supabase
        .from("users")
        .update({ coins: currentBalance - amount })
        .eq("id", userId)

      if (updateError) throw updateError

      // Record transaction
      const { error: transactionError } = await this.supabase.from("coin_transactions").insert({
        user_id: userId,
        amount: -amount,
        transaction_type: transaction.transaction_type,
        description: transaction.description,
        metadata: transaction.metadata,
        status: "completed",
        payment_method: "coins",
        currency: "NGN",
        exchange_rate: 1,
        fee_amount: 0,
      })

      if (transactionError) throw transactionError

      return true
    } catch (error) {
      console.error("Error deducting coins:", error)
      return false
    }
  }

  async addCoins(
    userId: string,
    amount: number,
    transaction: Omit<CoinTransaction, "user_id" | "amount">,
  ): Promise<boolean> {
    try {
      // Get current balance
      const { data: userData, error: userError } = await this.supabase
        .from("users")
        .select("coins")
        .eq("id", userId)
        .single()

      if (userError) throw userError

      const currentBalance = userData.coins || 0

      // Update user balance
      const { error: updateError } = await this.supabase
        .from("users")
        .update({ coins: currentBalance + amount })
        .eq("id", userId)

      if (updateError) throw updateError

      // Record transaction
      const { error: transactionError } = await this.supabase.from("coin_transactions").insert({
        user_id: userId,
        amount: amount,
        transaction_type: transaction.transaction_type,
        description: transaction.description,
        metadata: transaction.metadata,
        status: "completed",
        payment_method: "coins",
        currency: "NGN",
        exchange_rate: 1,
        fee_amount: 0,
      })

      if (transactionError) throw transactionError

      return true
    } catch (error) {
      console.error("Error adding coins:", error)
      return false
    }
  }

  async getTransactionHistory(userId: string, limit = 10): Promise<CoinTransaction[]> {
    try {
      const { data, error } = await this.supabase
        .from("coin_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching transaction history:", error)
      return []
    }
  }
}

// Hook for using coin manager
export function useCoinManager() {
  const { profile, refreshProfile } = useAuth()
  const coinManager = new CoinManager()

  const deductCoins = async (amount: number, transaction: Omit<CoinTransaction, "user_id" | "amount">) => {
    if (!profile?.id) return false

    const success = await coinManager.deductCoins(profile.id, amount, transaction)
    if (success) {
      await refreshProfile() // Refresh user profile to update balance
    }
    return success
  }

  const addCoins = async (amount: number, transaction: Omit<CoinTransaction, "user_id" | "amount">) => {
    if (!profile?.id) return false

    const success = await coinManager.addCoins(profile.id, amount, transaction)
    if (success) {
      await refreshProfile() // Refresh user profile to update balance
    }
    return success
  }

  return {
    deductCoins,
    addCoins,
    getBalance: () => coinManager.getUserBalance(profile?.id || ""),
    getTransactionHistory: () => coinManager.getTransactionHistory(profile?.id || ""),
    currentBalance: profile?.coins || 0,
  }
}
