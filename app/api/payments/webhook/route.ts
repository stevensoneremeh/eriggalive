import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    // Verify webhook signature
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET
    if (!secret) {
      console.error("PAYSTACK_WEBHOOK_SECRET not configured")
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }

    const hash = crypto.createHmac("sha512", secret).update(body).digest("hex")
    if (hash !== signature) {
      console.error("Invalid webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
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

    // Find payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("provider_ref", reference)
      .single()

    if (paymentError || !payment) {
      console.error("Payment not found:", reference)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Prevent duplicate processing
    if (payment.status === "completed") {
      return NextResponse.json({ message: "Payment already processed" })
    }

    // Validate amount
    if (amount !== payment.amount_ngn * 100) {
      // Paystack sends amount in kobo
      console.error("Amount mismatch:", { expected: payment.amount_ngn * 100, received: amount })
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 })
    }

    // Calculate months based on interval
    const months =
      payment.interval === "monthly"
        ? 1
        : payment.interval === "quarterly"
          ? 3
          : payment.interval === "annually"
            ? 12
            : 1

    // Process membership upgrade using database function
    const { error: upgradeError } = await supabase.rpc("process_membership_upgrade", {
      user_uuid: payment.user_id,
      tier_code: payment.tier_code,
      months: months,
      payment_ref: reference,
    })

    if (upgradeError) {
      console.error("Membership upgrade error:", upgradeError)
      return NextResponse.json({ error: "Failed to upgrade membership" }, { status: 500 })
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "completed",
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
