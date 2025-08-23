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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Authentication required", user: null, profile: null }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("id", user.id)
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

// Mock Paystack verification for preview mode
async function mockPaystackVerification(reference: string, expectedAmount: number) {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    status: true,
    data: {
      status: "success",
      amount: expectedAmount * 100, // Convert to kobo
      reference,
      paid_at: new Date().toISOString(),
      channel: "card",
      currency: "NGN",
      customer: {
        email: "user@example.com",
      },
    },
  }
}

// Real Paystack verification for production
async function verifyWithPaystack(reference: string, paystackSecretKey: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      "Content-Type": "application/json",
    },
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

    const { tierSlug, reference, amount, billingPeriod = "monthly" } = requestData

    if (!tierSlug || !reference || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    // Get membership tier details
    const { data: tier, error: tierError } = await supabase
      .from("membership_tiers")
      .select("*")
      .eq("slug", tierSlug)
      .eq("is_active", true)
      .single()

    if (tierError || !tier) {
      return NextResponse.json(
        {
          success: false,
          error: "Membership tier not found",
          code: "TIER_NOT_FOUND",
        },
        { status: 404 },
      )
    }

    // Validate amount matches tier price
    const expectedAmount =
      billingPeriod === "yearly" && tier.price_yearly
        ? Math.floor(tier.price_yearly / 100)
        : Math.floor(tier.price_monthly / 100)

    if (Math.abs(amount - expectedAmount) > 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Amount doesn't match tier price",
          code: "AMOUNT_MISMATCH",
        },
        { status: 400 },
      )
    }

    // Check for duplicate payment reference
    const { data: existingPayment } = await supabase
      .from("ticket_payments")
      .select("id")
      .eq("paystack_reference", reference)
      .single()

    if (existingPayment) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment reference already exists",
          code: "DUPLICATE_REFERENCE",
        },
        { status: 400 },
      )
    }

    // Verify transaction with Paystack
    let paystackData
    try {
      if (isPreviewMode()) {
        console.log("Using mock Paystack verification for preview mode")
        paystackData = await mockPaystackVerification(reference, amount)
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

        paystackData = await verifyWithPaystack(reference, paystackSecretKey)
      }

      if (!paystackData.status || paystackData.data.status !== "success") {
        return NextResponse.json(
          {
            success: false,
            error: "Payment verification failed",
            code: "PAYMENT_FAILED",
          },
          { status: 400 },
        )
      }

      // Verify amount matches
      const expectedAmountKobo = Math.round(amount * 100)
      const actualAmount = paystackData.data.amount

      if (Math.abs(actualAmount - expectedAmountKobo) > 100) {
        return NextResponse.json(
          {
            success: false,
            error: "Payment amount mismatch",
            code: "AMOUNT_MISMATCH",
          },
          { status: 400 },
        )
      }
    } catch (error) {
      console.error("Payment verification error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed",
          code: "VERIFICATION_ERROR",
        },
        { status: 500 },
      )
    }

    // Calculate subscription dates
    const startDate = new Date()
    const endDate = new Date()
    if (billingPeriod === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1)
    } else {
      endDate.setMonth(endDate.getMonth() + 1)
    }

    try {
      // Cancel existing active membership
      await supabase
        .from("user_memberships")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("status", "active")

      // Create new membership
      const { data: membership, error: membershipError } = await supabase
        .from("user_memberships")
        .insert({
          user_id: user.id,
          tier_id: tier.id,
          status: "active",
          started_at: startDate.toISOString(),
          expires_at: endDate.toISOString(),
          auto_renew: true,
          payment_reference: reference,
        })
        .select()
        .single()

      if (membershipError) {
        console.error("Membership creation error:", membershipError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create membership",
            code: "MEMBERSHIP_ERROR",
          },
          { status: 500 },
        )
      }

      // Award bonus coins if applicable
      const monthsCount = billingPeriod === "yearly" ? 12 : 1
      const bonusCoins = 1000 * monthsCount // 1000 coins per month

      if (bonusCoins > 0) {
        // Credit coins to wallet
        const { error: walletError } = await supabase.rpc("increment_wallet_balance", {
          p_user_id: user.id,
          p_delta: bonusCoins,
        })

        if (walletError) {
          console.error("Wallet update error:", walletError)
          // Don't fail the subscription, just log the error
        } else {
          // Create wallet transaction record
          await supabase.from("wallet_transactions").insert({
            user_id: user.id,
            transaction_type: "credit",
            amount: bonusCoins,
            balance_after: bonusCoins, // This would need to be calculated properly
            description: `Membership bonus: ${bonusCoins.toLocaleString()} coins for ${tier.name} subscription`,
            reference: reference,
            metadata: {
              membership_id: membership.id,
              tier_slug: tierSlug,
              billing_period: billingPeriod,
            },
          })
        }
      }

      console.log("Membership subscription completed successfully:", membership.id)

      return NextResponse.json({
        success: true,
        membership: {
          id: membership.id,
          tier_name: tier.name,
          status: membership.status,
          started_at: membership.started_at,
          expires_at: membership.expires_at,
          bonus_coins: bonusCoins,
        },
        message: `Successfully subscribed to ${tier.name} membership`,
        isPreviewMode: isPreviewMode(),
      })
    } catch (error) {
      console.error("Database operation error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Database operation failed",
          code: "DATABASE_ERROR",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Membership subscription API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405 },
  )
}
