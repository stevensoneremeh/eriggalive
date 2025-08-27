import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.json({ success: false, message: "Payment reference is required" }, { status: 400 })
    }

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ success: false, message: "Payment service not configured" }, { status: 500 })
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status || paystackData.data.status !== "success") {
      return NextResponse.json({ success: false, message: "Payment verification failed" }, { status: 400 })
    }

    // Find payment record
    const { data: payment, error: paymentError } = await supabase
      .from("membership_payments")
      .select("*")
      .or(`id.eq.${reference},paystack_reference.eq.${reference}`)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ success: false, message: "Payment record not found" }, { status: 404 })
    }

    // Update payment status
    await supabase
      .from("membership_payments")
      .update({
        status: "success",
        paid_at: new Date().toISOString(),
        payment_method: paystackData.data.channel,
      })
      .eq("id", payment.id)

    // Create or update user membership
    const tier = payment.metadata.tier
    const billingInterval = payment.metadata.billing_interval
    const customAmount = payment.metadata.custom_amount

    let expiresAt = null
    if (billingInterval === "monthly") {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    } else if (billingInterval === "quarterly") {
      expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    } else if (billingInterval === "annual" || billingInterval === "custom") {
      expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 365 days
    }

    // Update user membership
    const { error: membershipError } = await supabase.from("user_memberships").upsert({
      user_id: user.id,
      tier_id: tier.toUpperCase(),
      billing_interval: billingInterval,
      custom_amount: customAmount,
      status: "active",
      expires_at: expiresAt?.toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (membershipError) {
      console.error("Membership update error:", membershipError)
      return NextResponse.json({ success: false, message: "Failed to update membership" }, { status: 500 })
    }

    // Add monthly coin bonus
    if (tier === "pro" || tier === "enterprise") {
      const coinBonus = tier === "pro" ? 1000 : 12000

      await supabase
        .from("user_wallets")
        .update({
          coin_balance: supabase.raw("coin_balance + ?", [coinBonus]),
          total_earned: supabase.raw("total_earned + ?", [coinBonus]),
          last_bonus_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      // Record transaction
      await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        type: "bonus",
        amount: coinBonus,
        description: `${tier} membership activation bonus`,
        reference_id: payment.id,
      })
    }

    return NextResponse.json({
      success: true,
      payment: {
        ...payment,
        amount: paystackData.data.amount / 100, // Convert from kobo
      },
    })
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
