import { createClient } from "@/lib/supabase/server"
import type { MembershipTier, Membership } from "@/lib/types/ticketing"

export class MembershipService {
  private supabase = createClient()

  async getTiers(): Promise<MembershipTier[]> {
    const { data, error } = await this.supabase.from("membership_tiers").select("*").order("code")

    if (error) throw error
    return data || []
  }

  async createMembership(
    userId: string,
    tierCode: string,
    monthsPurchased: number,
    paymentId: string,
  ): Promise<Membership> {
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + monthsPurchased)

    const { data, error } = await this.supabase
      .from("memberships")
      .insert({
        user_id: userId,
        tier_code: tierCode,
        expires_at: expiresAt.toISOString(),
        total_months_purchased: monthsPurchased,
        status: "active",
      })
      .select()
      .single()

    if (error) throw error

    // Credit wallet with bonus coins (1000 per month)
    await this.creditMembershipBonus(userId, monthsPurchased, data.id)

    return data
  }

  async creditMembershipBonus(userId: string, months: number, membershipId: string) {
    const bonusCoins = months * 1000

    const { error } = await this.supabase.rpc("update_wallet_balance", {
      p_user_id: userId,
      p_amount_coins: bonusCoins,
      p_type: "credit",
      p_reason: "membership_bonus",
      p_ref_id: membershipId,
    })

    if (error) throw error
  }

  async getUserMembership(userId: string): Promise<Membership | null> {
    const { data, error } = await this.supabase
      .from("memberships")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") throw error
    return data || null
  }

  computeMonthsFromAmount(amount: number, monthlyPrice: number): number {
    return Math.max(1, Math.floor(amount / monthlyPrice))
  }

  async mapEnterpriseToProIfNeeded(
    amount: number,
    enterpriseMin: number,
    proMonthlyPrice: number,
  ): Promise<{ tierCode: string; months: number; shouldShowMessage: boolean }> {
    if (amount >= enterpriseMin) {
      return { tierCode: "ENT", months: 12, shouldShowMessage: false }
    }

    const months = this.computeMonthsFromAmount(amount, proMonthlyPrice)
    return { tierCode: "PRO", months, shouldShowMessage: true }
  }
}
