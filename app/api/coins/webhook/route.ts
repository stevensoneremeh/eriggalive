import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    // Verify webhook signature
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      console.error("Paystack secret key not configured")
      return NextResponse.json({ error: "Configuration error" }, { status: 500 })
    }

    const hash = crypto.createHmac("sha512", paystackSecretKey).update(body).digest("hex")

    if (hash !== signature) {
      console.error("Invalid webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(body)

    // Handle charge.success event
    if (event.event === "charge.success") {
      const { reference, amount, status, customer } = event.data

      if (status !== "success") {
        console.log(`Ignoring non-successful charge: ${reference}`)
        return NextResponse.json({ message: "Ignored non-successful charge" })
      }

      const supabase = await createClient()

      // Find existing transaction by reference
      const { data: transaction, error: findError } = await supabase
        .from("transactions")
        .select("*")
        .eq("reference", reference)
        .single()

      if (findError || !transaction) {
        console.error(`Transaction not found for reference: ${reference}`)
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
      }

      // Skip if already processed
      if (transaction.status === "success") {
        console.log(`Transaction already processed: ${reference}`)
        return NextResponse.json({ message: "Already processed" })
      }

      // Update transaction status
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          status: "success",
          verified_at: new Date().toISOString(),
          paystack_data: event.data,
        })
        .eq("id", transaction.id)

      if (updateError) {
        console.error("Failed to update transaction:", updateError)
        return NextResponse.json({ error: "Update failed" }, { status: 500 })
      }

      // Credit user coins
      const { error: balanceError } = await supabase.rpc("increment_user_coins", {
        user_id: transaction.user_id,
        coin_amount: transaction.coins_credited,
      })

      if (balanceError) {
        console.error("Failed to credit coins:", balanceError)
        // Mark transaction as failed
        await supabase.from("transactions").update({ status: "failed" }).eq("id", transaction.id)

        return NextResponse.json({ error: "Failed to credit coins" }, { status: 500 })
      }

      // Create coin transaction record
      await supabase.from("coin_transactions").insert({
        user_id: transaction.user_id,
        amount: transaction.coins_credited,
        transaction_type: "purchase",
        description: `Webhook: Purchased ${transaction.coins_credited.toLocaleString()} coins (${reference})`,
        status: "completed",
      })

      console.log(`Successfully processed webhook for transaction: ${reference}`)
      return NextResponse.json({ message: "Processed successfully" })
    }

    // Handle other events if needed
    console.log(`Unhandled webhook event: ${event.event}`)
    return NextResponse.json({ message: "Event not handled" })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
