import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const debitSchema = z.object({
  amount_coins: z.number().positive(),
  reason: z.enum(["ticket_purchase", "admin_adjustment"]),
  ref_id: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { amount_coins, reason, ref_id } = debitSchema.parse(body)

    const { data, error } = await supabase.rpc("update_wallet_balance", {
      p_user_id: user.id,
      p_amount_coins: amount_coins,
      p_type: "debit",
      p_reason: reason,
      p_ref_id: ref_id,
    })

    if (error) {
      console.error("Wallet debit error:", error)
      return NextResponse.json(
        {
          error: error.message.includes("Insufficient balance") ? "Insufficient balance" : "Failed to debit wallet",
        },
        { status: 400 },
      )
    }

    // Get updated balance
    const { data: wallet } = await supabase.from("wallets").select("balance_coins").eq("user_id", user.id).single()

    return NextResponse.json({
      success: true,
      new_balance: wallet?.balance_coins || 0,
      transaction: {
        amount_coins,
        type: "debit",
        reason,
      },
    })
  } catch (error) {
    console.error("Wallet debit API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
