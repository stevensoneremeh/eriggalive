import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClientWithAuth } from "@/lib/supabase/server"

// Mock user verification for development
function verifyUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { error: "Missing or invalid authorization header", user: null }
    }

    // In development, return mock user
    const mockUser = {
      id: 1,
      auth_user_id: "user-123",
      email: "user@example.com",
      username: "testuser",
      tier: "grassroot",
    }

    return { user: mockUser, error: null }
  } catch (error) {
    return { error: "Authentication failed", user: null }
  }
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
    throw new Error(`Paystack API error: ${response.status} - ${response.statusText}`)
  }

  return await response.json()
}

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const { user, error: authError } = verifyUser(request)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: authError || "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const { tier_id, payment_reference, amount } = await request.json()

    if (!tier_id || !payment_reference || !amount) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServerSupabaseClientWithAuth()

    // Get the target tier
    const { data: targetTier, error: tierError } = await supabase.from("tiers").select("*").eq("id", tier_id).single()

    if (tierError || !targetTier) {
      return NextResponse.json({ success: false, error: "Invalid tier selected" }, { status: 400 })
    }

    // Get current user tier rank
    const { data: currentTierData } = await supabase.from("tiers").select("rank").eq("name", user.tier).single()

    const currentTierRank = currentTierData?.rank || 0

    // Ensure user can only upgrade to higher tiers
    if (targetTier.rank <= currentTierRank) {
      return NextResponse.json({ success: false, error: "Can only upgrade to higher tiers" }, { status: 400 })
    }

    // Verify amount matches tier price
    const expectedAmount = Number.parseFloat(targetTier.price.toString())
    if (Math.abs(amount - expectedAmount) > 1) {
      return NextResponse.json({ success: false, error: "Amount doesn't match tier price" }, { status: 400 })
    }

    // Verify payment with Paystack
    let paystackData
    try {
      if (isPreviewMode()) {
        console.log("Using mock Paystack verification for preview mode")
        paystackData = await mockPaystackVerification(payment_reference, amount)
      } else {
        const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
        if (!paystackSecretKey) {
          return NextResponse.json({ success: false, error: "Payment gateway configuration error" }, { status: 500 })
        }
        paystackData = await verifyWithPaystack(payment_reference, paystackSecretKey)
      }

      if (!paystackData.status || paystackData.data.status !== "success") {
        return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 })
      }
    } catch (error) {
      console.error("Payment verification error:", error)
      return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 500 })
    }

    // Create payment record
    const { data: paymentRecord, error: paymentError } = await supabase
      .from("tier_payments")
      .insert({
        user_id: user.id,
        tier_id: targetTier.id,
        previous_tier: user.tier,
        amount: expectedAmount,
        currency: "NGN",
        status: "completed",
        reference: payment_reference,
        external_reference: paystackData.data.reference,
        metadata: {
          paystack_data: paystackData.data,
          upgrade_type: "tier_upgrade",
          is_preview_mode: isPreviewMode(),
        },
      })
      .select()
      .single()

    if (paymentError) {
      console.error("Payment record creation error:", paymentError)
      return NextResponse.json({ success: false, error: "Failed to create payment record" }, { status: 500 })
    }

    // Handle tier upgrade using the database function
    try {
      const { data: upgradeResult, error: upgradeError } = await supabase.rpc("handle_tier_upgrade", {
        p_user_id: user.id,
        p_tier_id: targetTier.id,
        p_payment_reference: payment_reference,
      })

      if (upgradeError) {
        console.error("Tier upgrade error:", upgradeError)
        return NextResponse.json({ success: false, error: "Failed to process tier upgrade" }, { status: 500 })
      }

      const isAutoUpgrade = upgradeResult === true

      return NextResponse.json({
        success: true,
        message: isAutoUpgrade
          ? `Successfully upgraded to ${targetTier.display_name}!`
          : `Payment received! Your upgrade to ${targetTier.display_name} is pending approval.`,
        payment: paymentRecord,
        auto_upgrade: isAutoUpgrade,
        new_tier: isAutoUpgrade ? targetTier.name : null,
        is_preview_mode: isPreviewMode(),
      })
    } catch (error) {
      console.error("Upgrade processing error:", error)
      return NextResponse.json({ success: false, error: "Failed to process upgrade" }, { status: 500 })
    }
  } catch (error) {
    console.error("Tier upgrade API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
