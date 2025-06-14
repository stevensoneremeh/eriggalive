import { type NextRequest, NextResponse } from "next/server"

// Mock user verification - in production, use proper JWT verification
function verifyUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader) return null

  // In production, verify JWT token here
  // For now, return mock user data
  return {
    id: "user-123",
    email: "user@example.com",
    username: "testuser",
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, reference, coins } = await request.json()

    // Validate the transaction with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status || paystackData.data.status !== "success") {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
    }

    // Verify the amount matches our expected amount
    const expectedAmount = coins * 0.5 * 100 // Convert to kobo
    if (paystackData.data.amount !== expectedAmount) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 })
    }

    // In production, save transaction to database
    const transaction = {
      id: `txn_${Date.now()}`,
      userId: user.id,
      type: "purchase",
      amount: coins,
      nairaAmount: amount,
      reference,
      status: "completed",
      createdAt: new Date().toISOString(),
    }

    // Mock database save
    console.log("Transaction saved:", transaction)

    return NextResponse.json({
      success: true,
      transaction,
      newBalance: coins, // In production, calculate from database
    })
  } catch (error) {
    console.error("Purchase error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
