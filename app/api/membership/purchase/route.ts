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

// Membership pricing (in NGN and coins)
const MEMBERSHIP_PRICING = {
  pro: {
    monthly: { naira: 5000, coins: 10000 },
    yearly: { naira: 50000, coins: 100000 },
  },
  enterprise: {
    monthly: { naira: 15000, coins: 30000 },
    yearly: { naira: 150000, coins: 300000 },
  },
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
      .select("*")
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
      amount: expectedAmount * 100,
      reference,
      paid_at: new Date().toISOString(),
      channel: "card",
      currency: "NGN",
      customer: { email: "user@example.com" },
    },
  }
}

// Real Paystack verification
async function verifyWithPaystack(reference: string, paystackSecretKey: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Paystack API error: ${response.status}`)
  }

  return await response.json()
}

export async function POST(request: NextRequest) {
  try {
    const { user, profile, error: authError } = await verifyUser(request)
    if (authError || !user || !profile) {
      return NextResponse.json({ success: false, error: authError || "Unauthorized" }, { status: 401 })
    }

    const requestData = await request.json()
    const { tier, duration, paymentMethod, paymentReference } = requestData

    // Validate input
    if (!tier || !duration || !paymentMethod) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    if (!["pro", "enterprise"].includes(tier)) {
      return NextResponse.json({ success: false, error: "Invalid membership tier" }, { status: 400 })
    }

    if (!["monthly", "yearly"].includes(duration)) {
      return NextResponse.json({ success: false, error: "Invalid duration" }, { status: 400 })
    }

    // Check if user already has this tier or higher
    const tierLevels = { free: 0, pro: 1, enterprise: 2 }
    const currentTierLevel = tierLevels[profile.membership_tier as keyof typeof tierLevels] || 0
    const requestedTierLevel = tierLevels[tier as keyof typeof tierLevels]

    if (
      currentTierLevel >= requestedTierLevel &&
      profile.membership_expires_at &&
      new Date(profile.membership_expires_at) > new Date()
    ) {
      return NextResponse.json(
        { success: false, error: "You already have this membership tier or higher" },
        { status: 400 },
      )
    }

    const pricing =
      MEMBERSHIP_PRICING[tier as keyof typeof MEMBERSHIP_PRICING][duration as keyof typeof MEMBERSHIP_PRICING.pro]
    const totalPrice = pricing.naira
    const totalCoins = pricing.coins

    const supabase = await createClient()

    // Process payment based on method
    if (paymentMethod === "paystack") {
      if (!paymentReference) {
        return NextResponse.json({ success: false, error: "Payment reference required for Paystack" }, { status: 400 })
      }

      // Verify payment with Paystack
      let paystackData
      try {
        if (isPreviewMode()) {
          paystackData = await mockPaystackVerification(paymentReference, totalPrice)
        } else {
          const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
          if (!paystackSecretKey) {
            return NextResponse.json({ success: false, error: "Payment gateway not configured" }, { status: 500 })
          }
          paystackData = await verifyWithPaystack(paymentReference, paystackSecretKey)
        }

        if (!paystackData.status || paystackData.data.status !== "success") {
          return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 })
        }

        // Verify amount
        const expectedAmountKobo = Math.round(totalPrice * 100)
        if (Math.abs(paystackData.data.amount - expectedAmountKobo) > 100) {
          return NextResponse.json({ success: false, error: "Payment amount mismatch" }, { status: 400 })
        }
      } catch (error) {
        console.error("Payment verification error:", error)
        return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 500 })
      }
    } else if (paymentMethod === "coins") {
      if (profile.coins_balance < totalCoins) {
        return NextResponse.json({ success: false, error: "Insufficient coins balance" }, { status: 400 })
      }

      // Deduct coins
      const { error: coinsError } = await supabase
        .from("profiles")
        .update({
          coins_balance: profile.coins_balance - totalCoins,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (coinsError) {
        return NextResponse.json({ success: false, error: "Failed to deduct coins" }, { status: 500 })
      }
    }

    // Calculate membership expiry
    const now = new Date()
    const currentExpiry = profile.membership_expires_at ? new Date(profile.membership_expires_at) : now
    const startDate = currentExpiry > now ? currentExpiry : now
    const expiryDate = new Date(startDate)

    if (duration === "monthly") {
      expiryDate.setMonth(expiryDate.getMonth() + 1)
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)
    }

    // Update user membership
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        membership_tier: tier,
        membership_expires_at: expiryDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Membership update error:", updateError)
      return NextResponse.json({ success: false, error: "Failed to update membership" }, { status: 500 })
    }

    // Create membership transaction record
    await supabase.from("membership_transactions").insert({
      user_id: user.id,
      from_tier: profile.membership_tier,
      to_tier: tier,
      duration_months: duration === "monthly" ? 1 : 12,
      amount_paid_naira: paymentMethod === "paystack" ? totalPrice : null,
      amount_paid_coins: paymentMethod === "coins" ? totalCoins : null,
      payment_method: paymentMethod,
      payment_reference: paymentReference,
      starts_at: startDate.toISOString(),
      expires_at: expiryDate.toISOString(),
      status: "active",
    })

    // Create transaction record
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "purchase",
      category: "membership",
      amount_naira: paymentMethod === "paystack" ? totalPrice : null,
      amount_coins: paymentMethod === "coins" ? totalCoins : null,
      payment_method: paymentMethod,
      paystack_reference: paymentReference,
      status: "completed",
      description: `Upgraded to ${tier} membership (${duration})`,
      reference_type: "membership",
      metadata: {
        tier,
        duration,
        expires_at: expiryDate.toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      membership: {
        tier,
        expires_at: expiryDate.toISOString(),
        duration,
        amount_paid: paymentMethod === "paystack" ? totalPrice : totalCoins,
        payment_method: paymentMethod,
      },
      message: `Successfully upgraded to ${tier} membership`,
    })
  } catch (error) {
    console.error("Membership purchase error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}
