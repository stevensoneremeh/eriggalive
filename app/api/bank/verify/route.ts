import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { accountNumber, bankCode } = await request.json()

    if (!accountNumber || !bankCode) {
      return NextResponse.json({ success: false, error: "Account number and bank code are required" }, { status: 400 })
    }

    // Validate account number format
    if (!/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json({ success: false, error: "Invalid account number format" }, { status: 400 })
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      console.log("Using mock bank verification - Paystack not configured")

      // Mock account verification for development
      const mockAccountNames = [
        "John Doe",
        "Jane Smith",
        "Ahmed Ibrahim",
        "Chioma Okafor",
        "Emeka Nwankwo",
        "Fatima Hassan",
        "Kemi Adebayo",
        "Chinedu Okoro",
        "Aisha Mohammed",
        "Tunde Williams",
      ]

      const randomName = mockAccountNames[Math.floor(Math.random() * mockAccountNames.length)]

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulate occasional failures (10% chance)
      if (Math.random() < 0.1) {
        return NextResponse.json({ success: false, error: "Could not resolve account name" }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        data: {
          account_number: accountNumber,
          account_name: randomName,
          bank_id: Number.parseInt(bankCode),
        },
      })
    }

    // Real Paystack bank verification
    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        {
          success: false,
          error: errorData.message || "Bank verification failed",
        },
        { status: response.status },
      )
    }

    const result = await response.json()

    if (!result.status) {
      return NextResponse.json(
        { success: false, error: result.message || "Account verification failed" },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error("Bank verification error:", error)
    return NextResponse.json({ success: false, error: "Bank verification service unavailable" }, { status: 500 })
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
