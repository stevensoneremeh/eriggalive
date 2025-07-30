import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, bankDetails } = await request.json()

    if (!amount || !bankDetails) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user has sufficient balance
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("erigga_coins")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }

    if ((profile?.erigga_coins || 0) < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Deduct coins from user's balance
    const { data: updatedProfile, error: updateError } = await supabase
      .from("user_profiles")
      .update({
        erigga_coins: supabase.raw(`erigga_coins - ${amount}`),
      })
      .eq("id", user.id)
      .select("erigga_coins")
      .single()

    if (updateError) {
      console.error("Error updating coin balance:", updateError)
      return NextResponse.json({ error: "Failed to update balance" }, { status: 500 })
    }

    // Record the withdrawal transaction
    const { error: transactionError } = await supabase.from("coin_transactions").insert({
      user_id: user.id,
      amount: -amount,
      type: "withdrawal",
      metadata: bankDetails,
      status: "pending",
    })

    if (transactionError) {
      console.error("Error recording transaction:", transactionError)
    }

    return NextResponse.json({
      success: true,
      newBalance: updatedProfile?.erigga_coins || 0,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
