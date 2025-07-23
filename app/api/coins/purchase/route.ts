import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServerSupabase } from "@/lib/supabase/server"

// Check if we're in preview/development mode
const isPreviewMode = () => {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.VERCEL_ENV === "preview" ||
    !process.env.PAYSTACK_SECRET_KEY ||
    process.env.PAYSTACK_SECRET_KEY.startsWith("pk_test_")
  )
}

// Enhanced user verification with Supabase
async function verifyUser(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Authentication required", user: null, profile: null }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError) {
      return { error: "Profile not found", user: null, profile: null }
    }

    return { user, profile, error: null }
  } catch (error) {
    return { error: "Authentication failed", user: null, profile: null }
  }
}

// Validate purchase request data
function validatePurchaseRequest(data: any) {
  const errors: string[] = []

  if (!data.reference || typeof data.reference !== "string") {
    errors.push("Invalid payment reference")
  }

  if (!data.amount || typeof data.amount !== "number" || data.amount <= 0) {
    errors.push("Invalid amount")
  }

  if (!data.coins || typeof data.coins !== "number" || data.coins < 100) {
    errors.push("Invalid coin amount")
  }

  // Validate exchange rate (1 coin = 0.5 NGN)
  const expectedAmount = Math.floor(data.coins * 0.5)
  if (Math.abs(data.amount - expectedAmount) > 1) {
    errors.push("Amount doesn't match expected exchange rate")
  }

  return errors
}

// Mock Paystack verification for preview mode
async function mockPaystackVerification(reference: string, expectedAmount: number) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    status: true,
    data: {
      status: "success",
      amount: expectedAmount * 100, // Convert to kobo
      reference,
      paid_at: new Date().toISOString(),
      channel: "card",
      currency: "NGN",
      customer: {
        email: "user@example.com",
      },
    },
  }
}

// Real Paystack verification for production
async function verifyWithPaystack(reference: string, paystackSecretKey: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Paystack API error: ${response.status} - ${response.statusText}`)
  }

  return await response.json()
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const body = await request.json()
    const { amount, paymentMethod, transactionId } = body

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("coins_balance")
      .eq("user_id", user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }

    const currentBalance = profile?.coins_balance || 0
    const newBalance = currentBalance + amount

    // Update user's coin balance
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        coins_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    if (updateError) {
      console.error("Balance update error:", updateError)
      return NextResponse.json({ error: "Failed to update balance" }, { status: 500 })
    }

    // Record transaction (if you have a transactions table)
    try {
      await supabase.from("coin_transactions").insert({
        user_id: user.id,
        type: "purchase",
        amount: amount,
        payment_method: paymentMethod || "unknown",
        transaction_id: transactionId,
        status: "completed",
        created_at: new Date().toISOString(),
      })
    } catch (transactionError) {
      // Don't fail the request if transaction logging fails
      console.error("Transaction logging error:", transactionError)
    }

    return NextResponse.json({
      success: true,
      newBalance,
      amountPurchased: amount,
      message: `Successfully purchased ${amount} coins`,
    })
  } catch (error) {
    console.error("Coin purchase error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405 },
  )
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405 },
  )
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405 },
  )
}
