import { type NextRequest, NextResponse } from "next/server"

function verifyUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader) return null

  return {
    id: "user-123",
    email: "user@example.com",
    username: "testuser",
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = verifyUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // In production, fetch from database
    const mockBalance = {
      currentBalance: 12500,
      openingBalance: 500,
      totalPurchased: 15000,
      totalWithdrawn: 3000,
      referralEarnings: 0,
      transactions: [
        {
          id: "txn_001",
          type: "opening_balance",
          amount: 500,
          description: "Welcome bonus",
          createdAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "txn_002",
          type: "purchase",
          amount: 15000,
          nairaAmount: 7500,
          description: "Coin purchase via Paystack",
          createdAt: "2024-01-15T10:30:00Z",
        },
        {
          id: "txn_003",
          type: "withdrawal",
          amount: -3000,
          nairaAmount: 1500,
          description: "Withdrawal to bank account",
          createdAt: "2024-01-20T14:45:00Z",
        },
      ],
    }

    return NextResponse.json({
      success: true,
      balance: mockBalance,
    })
  } catch (error) {
    console.error("Balance fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
