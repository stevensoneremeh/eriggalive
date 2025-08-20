import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

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
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { error: "Missing or invalid authorization header", user: null }
    }

    const token = authHeader.replace("Bearer ", "")

    // In production, verify JWT token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return { error: "Invalid authentication token", user: null }
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !profile) {
      return { error: "User profile not found", user: null }
    }

    return { user: profile, error: null }
  } catch (error) {
    console.error("Authentication error:", error)
    return { error: "Authentication failed", user: null }
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

async function createTransactionRecord(userId: string, transactionData: any) {
  const { data, error } = await supabase
    .from("coin_transactions")
    .insert({
      user_id: userId,
      amount: transactionData.coinAmount,
      transaction_type: "purchase",
      status: "completed",
      description: `Purchased ${transactionData.coinAmount.toLocaleString()} Erigga Coins`,
      paystack_reference: transactionData.reference,
      payment_method: "paystack",
      metadata: {
        naira_amount: transactionData.nairaAmount,
        exchange_rate: 0.5,
        payment_channel: transactionData.paymentData?.channel || "card",
        paid_at: transactionData.paymentData?.paidAt,
        is_preview_mode: isPreviewMode(),
      },
    })
    .select()
    .single()

  if (error) {
    console.error("Database error creating transaction:", error)
    throw new Error("Failed to create transaction record")
  }

  return data
}

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const { user, error: authError } = await verifyUser(request)
    if (authError || !user) {
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

    const { data: existingTransaction } = await supabase
      .from("coin_transactions")
      .select("id, status")
      .eq("paystack_reference", reference)
      .single()

    if (existingTransaction) {
      return NextResponse.json(
        {
          success: false,
          error: "Transaction already processed",
          code: "DUPLICATE_TRANSACTION",
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

    const transactionData = {
      coinAmount: coins,
      nairaAmount: amount,
      reference,
      paymentData: {
        channel: paystackData.data.channel || "card",
        paidAt: paystackData.data.paid_at || new Date().toISOString(),
        currency: paystackData.data.currency || "NGN",
      },
    }

    const transaction = await createTransactionRecord(user.id, transactionData)

    const { data: updatedUser, error: balanceError } = await supabase
      .from("users")
      .select("coins")
      .eq("id", user.id)
      .single()

    if (balanceError) {
      console.error("Error fetching updated balance:", balanceError)
    }

    const newBalance = updatedUser?.coins || user.coins + coins

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        userId: user.id,
        type: "purchase",
        coinAmount: coins,
        nairaAmount: amount,
        reference,
        status: "completed",
        createdAt: transaction.created_at,
        paymentData: transactionData.paymentData,
        metadata: {
          paymentMethod: "paystack",
          exchangeRate: 0.5,
          isPreviewMode: isPreviewMode(),
        },
      },
      newBalance,
      message: `Successfully purchased ${coins.toLocaleString()} Erigga Coins`,
      isPreviewMode: isPreviewMode(),
    })
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
