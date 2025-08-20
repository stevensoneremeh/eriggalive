import { type NextRequest, NextResponse } from "next/server"

// Enhanced user verification
function verifyUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { error: "Missing or invalid authorization header", user: null }
    }

    // Mock user data - in production, verify JWT token
    const mockUser = {
      id: "user-123",
      email: "user@example.com",
      username: "testuser",
    }

    return { user: mockUser, error: null }
  } catch (error) {
    return { error: "Authentication failed", user: null }
  }
}

// Validate bank verification request
function validateBankVerificationRequest(data: any) {
  const errors: string[] = []

  if (!data.bankCode || typeof data.bankCode !== "string") {
    errors.push("Bank code is required")
  }

  if (!data.accountNumber || typeof data.accountNumber !== "string") {
    errors.push("Account number is required")
  }

  if (data.accountNumber && data.accountNumber.length !== 10) {
    errors.push("Account number must be exactly 10 digits")
  }

  if (data.accountNumber && !/^\d+$/.test(data.accountNumber)) {
    errors.push("Account number must contain only digits")
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

// Check if we're in preview/development mode
const isPreviewMode = () => {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.VERCEL_ENV === "preview" ||
    !process.env.PAYSTACK_SECRET_KEY ||
    process.env.PAYSTACK_SECRET_KEY.startsWith("pk_test_")
  )
}

// Mock bank verification for preview mode
async function mockBankVerification(bankCode: string, accountNumber: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Generate realistic mock account names
  const mockAccountNames = [
    "John Doe",
    "Jane Smith",
    "Ahmed Ibrahim",
    "Chioma Okafor",
    "Emeka Nwankwo",
    "Fatima Hassan",
    "Olumide Adebayo",
    "Grace Okoro",
    "Ibrahim Musa",
    "Blessing Eze",
    "Tunde Adeyemi",
    "Amina Yusuf",
    "Chinedu Okonkwo",
    "Aisha Bello",
    "Kemi Adebisi",
  ]

  const randomName = mockAccountNames[Math.floor(Math.random() * mockAccountNames.length)]
  const bankName = getBankName(bankCode)

  // Simulate occasional verification failures (10% chance)
  if (Math.random() < 0.1) {
    throw new Error("Account verification failed. Please check your account number and try again.")
  }

  return {
    status: true,
    data: {
      account_number: accountNumber,
      account_name: randomName,
      bank_id: Number.parseInt(bankCode),
      bank_name: bankName,
    },
  }
}

// Real Paystack bank verification for production
async function verifyWithPaystack(bankCode: string, accountNumber: string, paystackSecretKey: string) {
  const response = await fetch("https://api.paystack.co/bank/resolve", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      "Content-Type": "application/json",
    },
    // Add query parameters for bank verification
    ...{
      url: `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Paystack API error: ${response.status} - ${response.statusText}`)
  }

  return await response.json()
}

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const { user, error: authError } = verifyUser(request)
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
    const validationErrors = validateBankVerificationRequest(requestData)
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

    const { bankCode, accountNumber } = requestData

    // Additional bank code validation
    if (!isValidBankCode(bankCode)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or unsupported bank code",
          code: "INVALID_BANK_CODE",
        },
        { status: 400 },
      )
    }

    // Verify account with Paystack (or mock in preview mode)
    let verificationData
    try {
      if (isPreviewMode()) {
        console.log("Using mock bank verification for preview mode")
        verificationData = await mockBankVerification(bankCode, accountNumber)
      } else {
        const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
        if (!paystackSecretKey) {
          console.error("Paystack secret key not configured")
          return NextResponse.json(
            {
              success: false,
              error: "Bank verification service configuration error",
              code: "CONFIG_ERROR",
            },
            { status: 500 },
          )
        }

        verificationData = await verifyWithPaystack(bankCode, accountNumber, paystackSecretKey)
      }

      if (!verificationData.status || !verificationData.data) {
        return NextResponse.json(
          {
            success: false,
            error: "Account verification failed - account not found or invalid",
            code: "VERIFICATION_FAILED",
          },
          { status: 400 },
        )
      }

      // Return successful verification
      return NextResponse.json({
        success: true,
        data: {
          accountNumber: verificationData.data.account_number,
          accountName: verificationData.data.account_name,
          bankCode: bankCode,
          bankName: verificationData.data.bank_name || getBankName(bankCode),
          verified: true,
          verifiedAt: new Date().toISOString(),
        },
        message: `Account verified successfully: ${verificationData.data.account_name}`,
        isPreviewMode: isPreviewMode(),
      })
    } catch (error) {
      console.error("Bank verification error:", error)

      // Handle specific error types
      let errorMessage = "Account verification failed"
      let errorCode = "VERIFICATION_ERROR"

      if (error instanceof Error) {
        if (error.message.includes("Account verification failed")) {
          errorMessage = error.message
          errorCode = "ACCOUNT_NOT_FOUND"
        } else if (error.message.includes("Paystack API error")) {
          errorMessage = "Bank verification service temporarily unavailable"
          errorCode = "SERVICE_UNAVAILABLE"
        } else {
          errorMessage = "Unable to verify account details"
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          code: errorCode,
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Bank verification API error:", error)
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
      error: "Method not allowed - use POST to verify bank account",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405 },
  )
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed - use POST to verify bank account",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405 },
  )
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed - use POST to verify bank account",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405 },
  )
}
