import { type NextRequest, NextResponse } from "next/server"

// Enhanced user verification with better error handling
function verifyUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { error: "Missing or invalid authorization header", user: null }
    }

    // In production, verify JWT token here
    // For now, return mock user data
    const mockUser = {
      id: "user-123",
      email: "user@example.com",
      username: "testuser",
      coins: 15000, // Mock current balance
    }

    return { user: mockUser, error: null }
  } catch (error) {
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

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const { user, error: authError } = verifyUser(request)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: authError || "Unauthorized" }, { status: 401 })
    }

    // Parse and validate request body
    let requestData
    try {
      requestData = await request.json()
    } catch (error) {
      return NextResponse.json({ success: false, error: "Invalid JSON in request body" }, { status: 400 })
    }

    // Validate request data
    const validationErrors = validatePurchaseRequest(requestData)
    if (validationErrors.length > 0) {
      return NextResponse.json({ success: false, error: validationErrors.join(", ") }, { status: 400 })
    }

    const { amount, reference, coins } = requestData

    // Verify transaction with Paystack
    try {
      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
      if (!paystackSecretKey) {
        console.error("Paystack secret key not configured")
        return NextResponse.json({ success: false, error: "Payment gateway configuration error" }, { status: 500 })
      }

      const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!paystackResponse.ok) {
        throw new Error(`Paystack API error: ${paystackResponse.status}`)
      }

      const paystackData = await paystackResponse.json()

      if (!paystackData.status || paystackData.data.status !== "success") {
        return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 })
      }

      // Verify the amount matches our expected amount (in kobo)
      const expectedAmountKobo = Math.round(amount * 100)
      if (Math.abs(paystackData.data.amount - expectedAmountKobo) > 100) {
        // Allow 1 NGN tolerance
        return NextResponse.json({ success: false, error: "Payment amount mismatch" }, { status: 400 })
      }

      // Verify the transaction hasn't been processed before
      // In production, check your database for duplicate references
    } catch (error) {
      console.error("Paystack verification error:", error)
      return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 500 })
    }

    // Create transaction record
    const transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      type: "purchase",
      coinAmount: coins,
      nairaAmount: amount,
      reference,
      status: "completed",
      createdAt: new Date().toISOString(),
      metadata: {
        paymentMethod: "paystack",
        exchangeRate: 0.5,
      },
    }

    // In production, save transaction to database
    console.log("Transaction completed:", transaction)

    // Calculate new balance (in production, update database)
    const newBalance = user.coins + coins

    return NextResponse.json({
      success: true,
      transaction,
      newBalance,
      message: `Successfully purchased ${coins.toLocaleString()} Erigga Coins`,
    })
  } catch (error) {
    console.error("Purchase API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}
