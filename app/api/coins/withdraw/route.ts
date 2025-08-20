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

// Validate withdrawal request
function validateWithdrawalRequest(data: any, userBalance: number) {
  const errors: string[] = []

  if (!data.amount || typeof data.amount !== "number" || data.amount <= 0) {
    errors.push("Invalid withdrawal amount")
  }

  if (data.amount < 100000) {
    errors.push("Minimum withdrawal amount is 100,000 Erigga Coins")
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

// Get bank name from code
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

// Mock Paystack bank verification for preview mode
async function mockBankVerification(accountNumber: string, bankCode: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const mockNames = ["John Doe", "Jane Smith", "Ahmed Ibrahim", "Chioma Okafor", "Emeka Nwankwo"]
  const randomName = mockNames[Math.floor(Math.random() * mockNames.length)]

  return {
    status: true,
    data: {
      account_number: accountNumber,
      account_name: randomName,
      bank_id: Number.parseInt(bankCode),
    },
  }
}

// Real Paystack bank verification for production
async function verifyBankAccount(accountNumber: string, bankCode: string, paystackSecretKey: string) {
  const response = await fetch("https://api.paystack.co/bank/resolve", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account_number: accountNumber,
      bank_code: bankCode,
    }),
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

    const validationErrors = validateWithdrawalRequest(requestData, profile.coins)
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

    const { amount, bankDetails } = requestData

    // Additional bank code validation
    if (!isValidBankCode(bankDetails.bankCode)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid bank code",
          code: "INVALID_BANK_CODE",
        },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    const { data: pendingWithdrawals } = await supabase
      .from("withdrawals")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")

    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "You already have a pending withdrawal request",
          code: "PENDING_WITHDRAWAL_EXISTS",
        },
        { status: 400 },
      )
    }

    // Calculate withdrawal amounts
    const nairaAmount = amount * 0.1 // Updated exchange rate: 100,000 coins = ₦10,000
    const processingFee = Math.max(25, nairaAmount * 0.01) // 1% fee, minimum ₦25
    const netAmount = nairaAmount - processingFee

    try {
      let bankVerificationData
      if (isPreviewMode()) {
        console.log("Using mock bank verification for preview mode")
        bankVerificationData = await mockBankVerification(bankDetails.accountNumber, bankDetails.bankCode)
      } else {
        const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
        if (!paystackSecretKey) {
          return NextResponse.json(
            {
              success: false,
              error: "Payment gateway configuration error",
              code: "CONFIG_ERROR",
            },
            { status: 500 },
          )
        }

        bankVerificationData = await verifyBankAccount(
          bankDetails.accountNumber,
          bankDetails.bankCode,
          paystackSecretKey,
        )
      }

      if (!bankVerificationData.status) {
        return NextResponse.json(
          {
            success: false,
            error: "Bank account verification failed",
            code: "BANK_VERIFICATION_FAILED",
          },
          { status: 400 },
        )
      }

      const { data: bankAccount, error: bankAccountError } = await supabase
        .from("bank_accounts")
        .upsert({
          user_id: user.id,
          account_number: bankDetails.accountNumber,
          bank_code: bankDetails.bankCode,
          bank_name: getBankName(bankDetails.bankCode),
          account_name: bankVerificationData.data.account_name,
          is_verified: true,
          verification_data: bankVerificationData.data,
        })
        .select()
        .single()

      if (bankAccountError) {
        console.error("Bank account creation error:", bankAccountError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to save bank account details",
            code: "BANK_ACCOUNT_ERROR",
          },
          { status: 500 },
        )
      }

      const { data: withdrawal, error: withdrawalError } = await supabase
        .from("withdrawals")
        .insert({
          user_id: user.id,
          bank_account_id: bankAccount.id,
          amount_coins: amount,
          amount_naira: Math.round(nairaAmount * 100), // Store in kobo
          status: "pending",
        })
        .select(`
          *,
          bank_accounts (
            account_number,
            bank_name,
            account_name
          )
        `)
        .single()

      if (withdrawalError) {
        console.error("Withdrawal creation error:", withdrawalError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create withdrawal request",
            code: "WITHDRAWAL_CREATION_ERROR",
          },
          { status: 500 },
        )
      }

      console.log("Withdrawal request created successfully:", withdrawal.id)

      return NextResponse.json({
        success: true,
        withdrawal: {
          id: withdrawal.id,
          amount_coins: withdrawal.amount_coins,
          amount_naira: withdrawal.amount_naira / 100, // Convert back from kobo
          net_amount: netAmount,
          processing_fee: processingFee,
          status: withdrawal.status,
          bank_details: withdrawal.bank_accounts,
          created_at: withdrawal.created_at,
        },
        message: `Withdrawal request submitted successfully. You will receive ₦${netAmount.toLocaleString()} in your ${getBankName(bankDetails.bankCode)} account within 1-3 business days.`,
        estimatedCompletionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        isPreviewMode: isPreviewMode(),
      })
    } catch (error) {
      console.error("Withdrawal processing error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to process withdrawal request",
          code: "PROCESSING_ERROR",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Withdrawal API error:", error)
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountNumber = searchParams.get("account_number")
    const bankCode = searchParams.get("bank_code")

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Account number and bank code are required",
        },
        { status: 400 },
      )
    }

    const { user, error: authError } = await verifyUser(request)
    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: authError || "Unauthorized",
        },
        { status: 401 },
      )
    }

    // Validate inputs
    if (accountNumber.length !== 10 || !/^\d+$/.test(accountNumber)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid account number format",
        },
        { status: 400 },
      )
    }

    if (!isValidBankCode(bankCode)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid bank code",
        },
        { status: 400 },
      )
    }

    // Verify bank account
    let bankVerificationData
    if (isPreviewMode()) {
      bankVerificationData = await mockBankVerification(accountNumber, bankCode)
    } else {
      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
      if (!paystackSecretKey) {
        return NextResponse.json(
          {
            success: false,
            error: "Payment gateway configuration error",
          },
          { status: 500 },
        )
      }

      bankVerificationData = await verifyBankAccount(accountNumber, bankCode, paystackSecretKey)
    }

    if (!bankVerificationData.status) {
      return NextResponse.json(
        {
          success: false,
          error: "Bank account verification failed",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      account_name: bankVerificationData.data.account_name,
      account_number: accountNumber,
      bank_name: getBankName(bankCode),
      isPreviewMode: isPreviewMode(),
    })
  } catch (error) {
    console.error("Bank verification error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Bank verification failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}
