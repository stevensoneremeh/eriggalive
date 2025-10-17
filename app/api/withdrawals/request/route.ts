import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const { bankAccountId, amountCoins } = await request.json()

    // Validate input
    if (!bankAccountId || !amountCoins) {
      return NextResponse.json(
        { success: false, error: "Bank account and withdrawal amount are required" },
        { status: 400 },
      )
    }

    if (typeof amountCoins !== "number" || amountCoins < 100000) {
      return NextResponse.json({ success: false, error: "Minimum withdrawal amount is 100,000 coins" }, { status: 400 })
    }

    // Get user profile with current coin balance
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, coins")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 })
    }

    // Check if user has sufficient balance
    if (profile.coins < amountCoins) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient balance. You have ${profile.coins.toLocaleString()} coins, but requested ${amountCoins.toLocaleString()} coins`,
        },
        { status: 400 },
      )
    }

    // Verify bank account belongs to user and is verified
    const { data: bankAccount, error: bankError } = await supabase
      .from("bank_accounts")
      .select(`
        *,
        nigerian_banks (
          bank_name,
          bank_type
        )
      `)
      .eq("id", bankAccountId)
      .eq("user_id", user.id)
      .eq("is_verified", true)
      .single()

    if (bankError || !bankAccount) {
      return NextResponse.json(
        { success: false, error: "Invalid or unverified bank account selected" },
        { status: 400 },
      )
    }

    // Check for existing pending withdrawals
    const { data: pendingWithdrawals } = await supabase
      .from("withdrawals")
      .select("id")
      .eq("user_id", user.id)
      .in("status", ["pending", "processing"])

    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      return NextResponse.json(
        { success: false, error: "You have a pending withdrawal request. Please wait for it to be processed." },
        { status: 400 },
      )
    }

    // Calculate exchange rate and naira amount (1 coin = 0.5 NGN)
    const exchangeRate = 0.5
    const amountNaira = amountCoins * exchangeRate

    // Create withdrawal request using the database function
    const { data: withdrawal, error: withdrawalError } = await supabase.rpc("create_withdrawal_request", {
      p_user_id: user.id,
      p_bank_account_id: bankAccountId,
      p_amount_coins: amountCoins,
      p_exchange_rate: exchangeRate,
    })

    if (withdrawalError) {
      console.error("Withdrawal creation error:", withdrawalError)
      return NextResponse.json({ success: false, error: "Failed to create withdrawal request" }, { status: 500 })
    }

    // Fetch the created withdrawal with bank details
    const { data: createdWithdrawal, error: fetchError } = await supabase
      .from("withdrawals")
      .select(`
        *,
        bank_accounts (
          account_number,
          account_name,
          nigerian_banks (
            bank_name
          )
        )
      `)
      .eq("id", withdrawal)
      .single()

    if (fetchError) {
      console.error("Error fetching created withdrawal:", fetchError)
      return NextResponse.json(
        { success: false, error: "Withdrawal created but failed to fetch details" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: createdWithdrawal.id,
        reference_code: createdWithdrawal.reference_code,
        amount_coins: createdWithdrawal.amount_coins,
        amount_naira: createdWithdrawal.amount_naira,
        status: createdWithdrawal.status,
        bank_account: {
          account_number: createdWithdrawal.bank_accounts.account_number,
          account_name: createdWithdrawal.bank_accounts.account_name,
          bank_name: createdWithdrawal.bank_accounts.nigerian_banks.bank_name,
        },
        created_at: createdWithdrawal.created_at,
      },
      message: `Withdrawal request submitted successfully. Reference: ${createdWithdrawal.reference_code}`,
    })
  } catch (error) {
    console.error("Withdrawal request API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
