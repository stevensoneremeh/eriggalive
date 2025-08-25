import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Mock bank verification for preview mode
async function mockBankVerification(accountNumber: string, bankCode: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Mock account names based on account number patterns
  const mockNames = [
    "JOHN DOE SMITH",
    "MARY JANE JOHNSON",
    "DAVID MICHAEL BROWN",
    "SARAH ELIZABETH DAVIS",
    "JAMES ROBERT WILSON",
  ]

  const randomName = mockNames[Math.floor(Math.random() * mockNames.length)]

  return {
    status: true,
    data: {
      account_number: accountNumber,
      account_name: randomName,
      bank_code: bankCode,
    },
  }
}

// Real Paystack bank verification
async function verifyWithPaystack(accountNumber: string, bankCode: string) {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

  if (!paystackSecretKey) {
    throw new Error("Paystack secret key not configured")
  }

  const response = await fetch(
    `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    {
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Paystack API error: ${response.status}`)
  }

  return await response.json()
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const { accountNumber, bankCode } = await request.json()

    // Validate input
    if (!accountNumber || !bankCode) {
      return NextResponse.json({ success: false, error: "Account number and bank code are required" }, { status: 400 })
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json({ success: false, error: "Account number must be exactly 10 digits" }, { status: 400 })
    }

    // Check if bank exists in our database
    const { data: bank, error: bankError } = await supabase
      .from("nigerian_banks")
      .select("*")
      .eq("bank_code", bankCode)
      .eq("is_active", true)
      .single()

    if (bankError || !bank) {
      return NextResponse.json({ success: false, error: "Invalid bank selected" }, { status: 400 })
    }

    // Check if account already exists for this user
    const { data: existingAccount } = await supabase
      .from("bank_accounts")
      .select("id, is_verified")
      .eq("user_id", user.id)
      .eq("account_number", accountNumber)
      .eq("bank_code", bankCode)
      .single()

    if (existingAccount) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        isVerified: existingAccount.is_verified,
        message: existingAccount.is_verified
          ? "This account is already verified"
          : "This account exists but needs verification",
      })
    }

    // Verify account with Paystack (or mock in preview mode)
    let verificationResult
    const isPreviewMode =
      process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview" || !process.env.PAYSTACK_SECRET_KEY

    try {
      if (isPreviewMode) {
        console.log("Using mock bank verification for preview mode")
        verificationResult = await mockBankVerification(accountNumber, bankCode)
      } else {
        verificationResult = await verifyWithPaystack(accountNumber, bankCode)
      }

      if (!verificationResult.status || !verificationResult.data) {
        return NextResponse.json({ success: false, error: "Account verification failed" }, { status: 400 })
      }
    } catch (error) {
      console.error("Bank verification error:", error)
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Verification service unavailable",
        },
        { status: 500 },
      )
    }

    // Save verified account to database
    const { data: newAccount, error: saveError } = await supabase
      .from("bank_accounts")
      .insert({
        user_id: user.id,
        account_number: accountNumber,
        bank_code: bankCode,
        account_name: verificationResult.data.account_name,
        is_verified: true,
        verification_reference: `verify_${Date.now()}`,
        verification_attempts: 1,
        last_verification_attempt: new Date().toISOString(),
      })
      .select()
      .single()

    if (saveError) {
      console.error("Error saving bank account:", saveError)
      return NextResponse.json({ success: false, error: "Failed to save account details" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      account: {
        id: newAccount.id,
        account_number: newAccount.account_number,
        account_name: newAccount.account_name,
        bank_name: bank.bank_name,
        bank_code: newAccount.bank_code,
        is_verified: newAccount.is_verified,
      },
      isPreviewMode,
    })
  } catch (error) {
    console.error("Bank verification API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
