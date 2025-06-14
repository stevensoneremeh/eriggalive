import { type NextRequest, NextResponse } from "next/server"

function verifyUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader) return null

  return {
    id: "user-123",
    email: "user@example.com",
    username: "testuser",
    coins: 15000, // Mock current balance
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, bankDetails } = await request.json()

    // Validate withdrawal amount
    if (amount < 10000) {
      return NextResponse.json(
        {
          error: "Minimum withdrawal amount is 10,000 Erigga Coins",
        },
        { status: 400 },
      )
    }

    if (user.coins < amount) {
      return NextResponse.json(
        {
          error: "Insufficient balance",
        },
        { status: 400 },
      )
    }

    // Calculate withdrawal amount in Naira
    const nairaAmount = amount * 0.5

    // In production, initiate bank transfer via Paystack Transfer API
    const transferData = {
      source: "balance",
      amount: nairaAmount * 100, // Convert to kobo
      recipient: bankDetails.recipientCode, // Pre-created recipient
      reason: `Erigga Coin withdrawal - ${amount} coins`,
    }

    // Mock Paystack transfer (in production, make actual API call)
    const mockTransferResponse = {
      status: true,
      data: {
        reference: `TRF_${Date.now()}`,
        status: "pending",
        transfer_code: `TRF_${Math.random().toString(36).substr(2, 9)}`,
      },
    }

    // Create withdrawal record
    const withdrawal = {
      id: `wth_${Date.now()}`,
      userId: user.id,
      type: "withdrawal",
      amount,
      nairaAmount,
      reference: mockTransferResponse.data.reference,
      status: "pending",
      bankDetails,
      createdAt: new Date().toISOString(),
    }

    console.log("Withdrawal initiated:", withdrawal)

    return NextResponse.json({
      success: true,
      withdrawal,
      message: "Withdrawal request submitted successfully. Processing time: 1-3 business days.",
    })
  } catch (error) {
    console.error("Withdrawal error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
