import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Enhanced user verification with Supabase
async function verifyUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { error: "Missing or invalid authorization header", user: null }
    }

    const token = authHeader.replace("Bearer ", "")

    // Verify JWT token with Supabase
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

// Verify bank account with Paystack
async function verifyBankAccount(accountNumber: string, bankCode: string) {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
  if (!paystackSecretKey) {
    throw new Error("Paystack configuration not found")
  }

  const response = await fetch("https://api.paystack.co/bank/resolve", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      "Content-Type": "application/json",
    },
    // Add query parameters for account verification
  })

  if (!response.ok) {
    throw new Error("Bank account verification failed")
  }

  const result = await response.json()
  return result
}

// Create bank account record
async function createOrUpdateBankAccount(userId: string, bankDetails: any) {
  const { data: existingAccount } = await supabase
    .from("bank_accounts")
    .select("id")
    .eq("user_id", userId)
    .eq("account_number", bankDetails.accountNumber)
    .eq("bank_code", bankDetails.bankCode)
    .single()

  if (existingAccount) {
    // Update existing account
    const { data, error } = await supabase
      .from("bank_accounts")
      .update({
        account_name: bankDetails.accountName,
        bank_name: bankDetails.bankName,
        is_verified: true,
        verification_data: bankDetails.verificationData || {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingAccount.id)
      .select()
      .single()

    if (error) throw error
    return data
  } else {
    // Create new account
    const { data, error } = await supabase
      .from("bank_accounts")
      .insert({
        user_id: userId,
        account_number: bankDetails.accountNumber,
        account_name: bankDetails.accountName,
        bank_code: bankDetails.bankCode,
        bank_name: bankDetails.bankName,
        is_verified: true,
        is_active: true,
        verification_data: bankDetails.verificationData || {},
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Create withdrawal request
async function createWithdrawalRequest(userId: string, bankAccountId: string, withdrawalData: any) {
  const { data, error } = await supabase
    .from("withdrawals")
    .insert({
      user_id: userId,
      bank_account_id: bankAccountId,
      amount_coins: withdrawalData.amount,
      amount_naira: Math.round(withdrawalData.nairaAmount * 100), // Convert to kobo
      exchange_rate: 10.0, // 100,000 coins = ₦10,000
      status: "pending",
      metadata: {
        processing_fee: withdrawalData.processingFee,
        net_amount: withdrawalData.netAmount,
        requested_via: "web_app",
        user_agent: withdrawalData.userAgent || "unknown",
      },
    })
    .select()
    .single()

  if (error) {
    console.error("Database error creating withdrawal:", error)
    throw new Error("Failed to create withdrawal request")
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
    const validationErrors = validateWithdrawalRequest(requestData, user.coins)
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

    // Check for recent withdrawal requests (rate limiting)
    const { data: recentWithdrawals } = await supabase
      .from("withdrawals")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .eq("status", "pending")

    if (recentWithdrawals && recentWithdrawals.length >= 3) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many pending withdrawal requests. Please wait for existing requests to be processed.",
          code: "RATE_LIMITED",
        },
        { status: 429 },
      )
    }

    // Calculate withdrawal amounts (100,000 coins = ₦10,000)
    const nairaAmount = (amount / 100000) * 10000
    const processingFee = Math.max(25, nairaAmount * 0.01) // 1% fee, minimum ₦25
    const netAmount = nairaAmount - processingFee

    try {
      // Create or update bank account record
      const bankAccount = await createOrUpdateBankAccount(user.id, {
        accountNumber: bankDetails.accountNumber,
        accountName: bankDetails.accountName,
        bankCode: bankDetails.bankCode,
        bankName: bankDetails.bankName,
        verificationData: {
          verified_at: new Date().toISOString(),
          verification_method: "paystack_resolve",
        },
      })

      // Create withdrawal request
      const withdrawal = await createWithdrawalRequest(user.id, bankAccount.id, {
        amount,
        nairaAmount,
        processingFee,
        netAmount,
        userAgent: request.headers.get("user-agent"),
      })

      return NextResponse.json({
        success: true,
        withdrawal: {
          id: withdrawal.id,
          userId: user.id,
          amount: amount,
          nairaAmount,
          processingFee,
          netAmount,
          status: "pending",
          bankDetails: {
            bankName: bankDetails.bankName,
            accountNumber: bankDetails.accountNumber,
            accountName: bankDetails.accountName,
          },
          createdAt: withdrawal.created_at,
          estimatedProcessingTime: "1-3 business days",
        },
        message: `Withdrawal request submitted successfully. You will receive ₦${netAmount.toLocaleString()} in your ${bankDetails.bankName} account within 1-3 business days after admin approval.`,
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
