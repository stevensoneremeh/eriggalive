import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          code: "AUTH_ERROR",
        },
        { status: 401 },
      )
    }

    // Get user profile with coin balance
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("coins_balance, id, username")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      return NextResponse.json(
        {
          success: false,
          error: "Profile not found",
          code: "PROFILE_ERROR",
        },
        { status: 404 },
      )
    }

    // Mock transaction history for now
    const mockTransactions = [
      {
        id: "txn_001",
        type: "opening_balance",
        amount: 500,
        description: "Welcome bonus",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "completed",
      },
      {
        id: "txn_002",
        type: "purchase",
        amount: 1000,
        nairaAmount: 500,
        description: "Coin purchase",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: "completed",
      },
      {
        id: "txn_003",
        type: "referral",
        amount: 100,
        description: "Referral bonus",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: "completed",
      },
    ]

    const currentBalance = profile.coins_balance || 0
    const totalPurchased = 1000
    const totalWithdrawn = 0
    const referralEarnings = 100
    const openingBalance = 500

    return NextResponse.json({
      success: true,
      balance: {
        currentBalance,
        openingBalance,
        totalPurchased,
        totalWithdrawn,
        referralEarnings,
        transactions: mockTransactions,
      },
    })
  } catch (error) {
    console.error("Balance API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
