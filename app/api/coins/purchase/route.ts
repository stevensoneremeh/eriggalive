import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Check if we're in preview/development mode
const isPreviewMode = () => {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.VERCEL_ENV === "preview" ||
    !process.env.PAYSTACK_SECRET_KEY ||
    process.env.PAYSTACK_SECRET_KEY.startsWith("pk_test_")
  )
}

async function verifyUser(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Authentication required", user: null, profile: null }
    }

    // Get user profile with current coin balance
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, email, username, coins, tier")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !profile) {
      return { error: "User profile not found", user: null, profile: null }
    }

    return { user, profile, error: null }
  } catch (error) {
    console.error("Authentication error:", error)
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
    const { user, profile, error: authError } = await verifyUser(request)
    if (authError || !user || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: authError || "Unauthorized",
          code: "AUTH_ERROR",
        },
        { status: 401 },
      )
    }

    // Parse and validate request body
    let requestData
    try {
      requestData = await request.json()
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          code: "INVALID_JSON",
        },
        { status: 400 },
      )
    }

    // Validate request data
    const validationErrors = validatePurchaseRequest(requestData)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: validationErrors.join(", "),
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      )
    }

    const { amount, reference, coins } = requestData

    const supabase = await createClient()
    const { data: existingTransaction } = await supabase
      .from("transactions")
      .select("id")
      .eq("reference", reference)
      .single()

    if (existingTransaction) {
      return NextResponse.json(
        {
          success: false,
          error: "Transaction reference already exists",
          code: "DUPLICATE_REFERENCE",
        },
        { status: 400 },
      )
    }

    // Verify transaction with Paystack (or mock in preview mode)
    let paystackData
    try {
      if (isPreviewMode()) {
        console.log("Using mock Paystack verification for preview mode")
        paystackData = await mockPaystackVerification(reference, amount)
      } else {
        const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
        if (!paystackSecretKey) {
          console.error("Paystack secret key not configured")
          return NextResponse.json(
            {
              success: false,
              error: "Payment gateway configuration error",
              code: "CONFIG_ERROR",
            },
            { status: 500 },
          )
        }

        paystackData = await verifyWithPaystack(reference, paystackSecretKey)
      }

      if (!paystackData.status || paystackData.data.status !== "success") {
        return NextResponse.json(
          {
            success: false,
            error: "Payment verification failed - transaction not successful",
            code: "PAYMENT_FAILED",
          },
          { status: 400 },
        )
      }

      // Verify the amount matches our expected amount (in kobo)
      const expectedAmountKobo = Math.round(amount * 100)
      const actualAmount = paystackData.data.amount

      if (Math.abs(actualAmount - expectedAmountKobo) > 100) {
        // Allow 1 NGN tolerance
        console.error(`Amount mismatch: expected ${expectedAmountKobo}, got ${actualAmount}`)
        return NextResponse.json(
          {
            success: false,
            error: "Payment amount mismatch",
            code: "AMOUNT_MISMATCH",
            details: {
              expected: expectedAmountKobo,
              actual: actualAmount,
            },
          },
          { status: 400 },
        )
      }
    } catch (error) {
      console.error("Payment verification error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed - unable to verify with payment gateway",
          code: "VERIFICATION_ERROR",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }

    try {
      // Start a transaction to ensure data consistency
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          reference,
          amount: Math.round(amount * 100), // Store in kobo
          coins_credited: coins,
          status: "success",
          payment_method: "paystack",
          paystack_data: paystackData.data,
          metadata: {
            exchange_rate: 0.5,
            is_preview_mode: isPreviewMode(),
            channel: paystackData.data.channel || "card",
            currency: paystackData.data.currency || "NGN",
          },
          verified_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (transactionError) {
        console.error("Transaction creation error:", transactionError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create transaction record",
            code: "DATABASE_ERROR",
          },
          { status: 500 },
        )
      }

      // Update user coin balance
      const { data: updatedProfile, error: updateError } = await supabase
        .from("users")
        .update({
          coins: profile.coins + coins,
          updated_at: new Date().toISOString(),
        })
        .eq("auth_user_id", user.id)
        .select("coins")
        .single()

      if (updateError) {
        console.error("Balance update error:", updateError)
        // Try to mark transaction as failed
        await supabase.from("transactions").update({ status: "failed" }).eq("id", transaction.id)

        return NextResponse.json(
          {
            success: false,
            error: "Failed to update coin balance",
            code: "BALANCE_UPDATE_ERROR",
          },
          { status: 500 },
        )
      }

      // Create coin transaction record for audit trail
      await supabase.from("coin_transactions").insert({
        user_id: user.id,
        amount: coins,
        transaction_type: "purchase",
        description: `Purchased ${coins.toLocaleString()} coins via Paystack (${reference})`,
        status: "completed",
      })

      console.log("Transaction completed successfully:", transaction.id)

      return NextResponse.json({
        success: true,
        transaction: {
          id: transaction.id,
          reference: transaction.reference,
          coins_credited: transaction.coins_credited,
          amount_naira: amount,
          status: transaction.status,
          created_at: transaction.created_at,
        },
        newBalance: updatedProfile.coins,
        message: `Successfully purchased ${coins.toLocaleString()} Erigga Coins`,
        isPreviewMode: isPreviewMode(),
      })
    } catch (error) {
      console.error("Database operation error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Database operation failed",
          code: "DATABASE_ERROR",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Purchase API error:", error)
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
