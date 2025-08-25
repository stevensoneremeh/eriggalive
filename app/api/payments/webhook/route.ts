import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    const secret = process.env.PAYSTACK_WEBHOOK_SECRET
    if (secret && signature) {
      const hash = crypto.createHmac("sha512", secret).update(body).digest("hex")
      if (hash !== signature) {
        console.error("Invalid webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
      }
    } else if (!secret) {
      console.warn("PAYSTACK_WEBHOOK_SECRET not configured - webhook verification skipped")
    }

    const event = JSON.parse(body)

    // Only process successful charge events
    if (event.event !== "charge.success") {
      return NextResponse.json({ message: "Event ignored" })
    }

    const { reference, amount, status, metadata } = event.data

    if (status !== "success") {
      return NextResponse.json({ message: "Payment not successful" })
    }

    const supabase = await createClient()

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("reference", reference)
      .single()

    if (paymentError || !payment) {
      console.error("Payment not found:", reference)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Prevent duplicate processing
    if (payment.status === "completed") {
      return NextResponse.json({ message: "Payment already processed" })
    }

    const expectedAmount = Math.round(payment.amount * 100) // Convert to kobo
    if (Math.abs(amount - expectedAmount) > 100) {
      // Allow small rounding differences
      console.error("Amount mismatch:", { expected: expectedAmount, received: amount })
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 })
    }

    const { tier, billing_interval } = payment.metadata as any

    // Calculate expiry date
    const now = new Date()
    const expiryDate = new Date(now)

    if (billing_interval === "monthly") {
      expiryDate.setMonth(expiryDate.getMonth() + 1)
    } else if (billing_interval === "quarterly") {
      expiryDate.setMonth(expiryDate.getMonth() + 3)
    } else if (billing_interval === "annually") {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)
    }

    // Update or create membership
    const { error: membershipError } = await supabase.from("memberships").upsert({
      user_id: payment.user_id,
      tier_id: tier,
      status: "active",
      billing_interval: billing_interval,
      amount_paid: payment.amount,
      expires_at: expiryDate.toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (membershipError) {
      console.error("Membership update error:", membershipError)
      return NextResponse.json({ error: "Failed to update membership" }, { status: 500 })
    }

    const coinBonus =
      tier === "PRO"
        ? billing_interval === "monthly"
          ? 1000
          : billing_interval === "quarterly"
            ? 3000
            : 12000
        : tier === "ENT"
          ? 12000
          : 0

    if (coinBonus > 0) {
      // Add coins using the database function
      const { error: coinsError } = await supabase.rpc("add_coins", {
        user_id: payment.user_id,
        amount: coinBonus,
        description: `${tier} membership bonus - ${billing_interval}`,
      })

      if (coinsError) {
        console.error("Coins bonus error:", coinsError)
        // Don't fail the webhook for coin errors, just log
      }
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "completed",
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id)

    if (updateError) {
      console.error("Payment update error:", updateError)
    }

    console.log(`Successfully processed payment ${reference} for user ${payment.user_id}`)

    return NextResponse.json({ message: "Payment processed successfully" })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
