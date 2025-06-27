import { createClient } from "@/lib/supabase-utils"
import type { Database } from "@/types/database"

type Tier = Database["public"]["Tables"]["tiers"]["Row"]
type Payment = Database["public"]["Tables"]["payments"]["Row"]
type TierUpgrade = Database["public"]["Tables"]["tier_upgrades"]["Row"]

export interface TierWithAccess extends Tier {
  canUpgrade: boolean
  isCurrentTier: boolean
  isLowerTier: boolean
}

export class TierService {
  private supabase = createClient()

  async getAllTiers(): Promise<Tier[]> {
    const { data, error } = await this.supabase
      .from("tiers")
      .select("*")
      .eq("is_active", true)
      .order("rank", { ascending: true })

    if (error) {
      console.error("Error fetching tiers:", error)
      return []
    }

    return data || []
  }

  async getTiersWithUserAccess(userTierId?: number): Promise<TierWithAccess[]> {
    const tiers = await this.getAllTiers()

    return tiers.map((tier) => ({
      ...tier,
      canUpgrade: userTierId ? tier.rank > (tiers.find((t) => t.id === userTierId)?.rank || 0) : tier.rank > 0,
      isCurrentTier: tier.id === userTierId,
      isLowerTier: userTierId ? tier.rank < (tiers.find((t) => t.id === userTierId)?.rank || 0) : false,
    }))
  }

  async getUserCurrentTier(userId: number): Promise<Tier | null> {
    const { data, error } = await this.supabase
      .from("users")
      .select(`
        tier_id,
        tiers (*)
      `)
      .eq("id", userId)
      .single()

    if (error || !data?.tiers) {
      console.error("Error fetching user tier:", error)
      return null
    }

    return data.tiers as Tier
  }

  async createPayment(
    userId: number,
    tierId: number,
    amount: number,
  ): Promise<{ payment: Payment; reference: string } | null> {
    const reference = `tier_upgrade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const { data, error } = await this.supabase
      .from("payments")
      .insert({
        user_id: userId,
        tier_id: tierId,
        amount,
        reference,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating payment:", error)
      return null
    }

    return { payment: data, reference }
  }

  async createTierUpgrade(
    userId: number,
    fromTierId: number | null,
    toTierId: number,
    paymentId: number,
  ): Promise<TierUpgrade | null> {
    const { data, error } = await this.supabase
      .from("tier_upgrades")
      .insert({
        user_id: userId,
        from_tier_id: fromTierId,
        to_tier_id: toTierId,
        payment_id: paymentId,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating tier upgrade:", error)
      return null
    }

    return data
  }

  async verifyPayment(reference: string): Promise<boolean> {
    try {
      const response = await fetch("/api/tiers/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reference }),
      })

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error("Error verifying payment:", error)
      return false
    }
  }

  async getUserPayments(userId: number): Promise<Payment[]> {
    const { data, error } = await this.supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user payments:", error)
      return []
    }

    return data || []
  }

  async getUserTierUpgrades(userId: number): Promise<TierUpgrade[]> {
    const { data, error } = await this.supabase
      .from("tier_upgrades")
      .select(`
        *,
        from_tier:from_tier_id(name),
        to_tier:to_tier_id(name),
        payment:payment_id(*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user tier upgrades:", error)
      return []
    }

    return data || []
  }

  hasAccess(userTierRank: number, requiredTierRank: number): boolean {
    return userTierRank >= requiredTierRank
  }

  async getSystemConfig(key: string): Promise<any> {
    const { data, error } = await this.supabase.from("system_config").select("value").eq("key", key).single()

    if (error) {
      console.error("Error fetching system config:", error)
      return null
    }

    return data?.value
  }
}

export const tierService = new TierService()
