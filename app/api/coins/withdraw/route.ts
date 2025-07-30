import { type NextRequest, NextResponse } from "next/server"

// Enhanced user verification
function verifyUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { error: "Missing or invalid authorization header", user: null }
    }

    // Mock user data with current balance
    const mockUser = {
      id: "user-123",
      email: "user@example.com",
      username: "testuser",
      coins: 25000, // Mock current balance
    }

    return { user: mockUser, error: null }
  } catch (error) {
    return { error: "Authentication failed", user: null }
  }
}

// Validate withdrawal request
function validateWithdrawalRequest(data: any, userBalance: number) {
  const errors: string[] = []

  if (!data.amount || typeof data.amount !== "number" || data.amount <= 0) {
    errors.push("Invalid withdrawal amount")
  }

  if (data.amount < 10000) {
    errors.push("Minimum withdrawal amount is 10,000 Erigga Coins")
  }

  if (data.amount > 1000000) {
    errors.push("Maximum withdrawal amount is 1,000,000 Erigga Coins")
  }

  if (data.amount > userBalance) {
    errors.push("Insufficient balance")
  }

  if (!data.bankDetails || typeof data.bankDetails !== "object") {
    errors.push("Bank details are required")
  } else {
    const { bankCode, accountNumber, accountName } = data.bankDetails

    if (!bankCode || typeof bankCode !== "string") {
      errors.push("Bank code is required")
    }

    if (!accountNumber || typeof accountNumber !== "string" || accountNumber.length !== 10) {
      errors.push("Valid 10-digit account number is required")
    }

    if (!/^\d+$/.test(accountNumber)) {
      errors.push("Account number must contain only digits")
    }

    if (!accountName || typeof accountName !== "string" || accountName.trim().length < 2) {
      errors.push("Account name is required")
    }
  }

  return errors
}

// Validate Nigerian bank code
function isValidBankCode(bankCode: string): boolean {
  const validBankCodes = [
    "044",
    "014",
    "023",
    "050",
    "011",
    "214",
    "070",
    "058",
    "030",
    "082",
    "076",
    "221",
    "068",
    "232",
    "032",
    "033",
    "215",
    "035",
    "057",
  ]
  return validBankCodes.includes(bankCode)
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
    const validationErrors = validateWithdrawalRequest(requestData, user.coins)
    if (validationErrors.length > 0) {
      return NextResponse.json({ success: false, error: validationErrors.join(", ") }, { status: 400 })
    }

    const { amount, bankDetails } = requestData

    // Additional bank code validation
    if (!isValidBankCode(bankDetails.bankCode)) {
      return NextResponse.json({ success: false, error: "Invalid bank code" }, { status: 400 })
    }

    // Calculate withdrawal amounts
    const nairaAmount = amount * 0.5
    const processingFee = Math.max(25, nairaAmount * 0.01) // 1% fee, minimum ₦25
    const netAmount = nairaAmount - processingFee

    // In production, create recipient and initiate transfer via Paystack
    try {
      // Mock Paystack transfer creation
      const transferReference = `TRF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // In production, make actual Paystack API calls:
      // 1. Create transfer recipient
      // 2. Initiate transfer
      // 3. Handle webhook for status updates

      const mockTransferResponse = {
        status: true,
        data: {
          reference: transferReference,
          status: "pending",
          transfer_code: `TRF_${Math.random().toString(36).substr(2, 9)}`,
          amount: netAmount * 100, // in kobo
        },
      }

      // Create withdrawal record
      const withdrawal = {
        id: `wth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        type: "withdrawal",
        coinAmount: amount,
        nairaAmount,
        processingFee,
        netAmount,
        reference: transferReference,
        status: "pending",
        bankDetails: {
          ...bankDetails,
          bankName: getBankName(bankDetails.bankCode),
        },
        createdAt: new Date().toISOString(),
        estimatedCompletionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
      }

      // In production, save to database and deduct coins from user balance
      console.log("Withdrawal initiated:", withdrawal)

      return NextResponse.json({
        success: true,
        withdrawal,
        message: `Withdrawal request submitted successfully. You will receive ₦${netAmount.toLocaleString()} in your ${getBankName(bankDetails.bankCode)} account within 1-3 business days.`,
        estimatedCompletionDate: withdrawal.estimatedCompletionDate,
      })
    } catch (error) {
      console.error("Transfer initiation error:", error)
      return NextResponse.json({ success: false, error: "Failed to initiate bank transfer" }, { status: 500 })
    }
  } catch (error) {
    console.error("Withdrawal API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to get bank name from code
function getBankName(bankCode: string): string {
  const bankMap: Record<string, string> = {
    "044": "Access Bank",
    "014": "Afribank",
    "023": "Citibank",
    "050": "Ecobank",
    "011": "First Bank",
    "214": "First City Monument Bank",
    "070": "Fidelity Bank",
    "058": "Guaranty Trust Bank",
    "030": "Heritage Bank",
    "082": "Keystone Bank",
    "076": "Polaris Bank",
    "221": "Stanbic IBTC Bank",
    "068": "Standard Chartered",
    "232": "Sterling Bank",
    "032": "Union Bank",
    "033": "United Bank for Africa",
    "215": "Unity Bank",
    "035": "Wema Bank",
    "057": "Zenith Bank",
  }
  return bankMap[bankCode] || "Unknown Bank"
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}
