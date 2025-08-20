import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

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
      const { data } = event
      const reference = data.reference
      const amount = data.amount // Amount in kobo
      const email = data.customer.email

      // Extract coin amount from metadata
      const coinAmount = data.metadata?.coin_amount
      if (!coinAmount) {
        console.error("No coin amount in webhook metadata")
        return NextResponse.json({ error: "Invalid metadata" }, { status: 400 })
      }

      // Find user by email
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, auth_user_id")
        .eq("email", email)
        .single()

      if (userError || !user) {
        console.error("User not found for webhook:", email)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Check if transaction already exists
      const { data: existingTransaction } = await supabase
        .from("coin_transactions")
        .select("id")
        .eq("paystack_reference", reference)
        .single()

      if (existingTransaction) {
        console.log("Transaction already processed:", reference)
        return NextResponse.json({ message: "Already processed" }, { status: 200 })
      }

      // Create transaction record (triggers will handle coin balance update)
      const { data: transaction, error: transactionError } = await supabase
        .from("coin_transactions")
        .insert({
          user_id: user.id,
          amount: coinAmount,
          transaction_type: "purchase",
          status: "completed",
          description: `Webhook: Purchased ${coinAmount.toLocaleString()} Erigga Coins`,
          paystack_reference: reference,
          payment_method: "paystack",
          metadata: {
            naira_amount: amount / 100, // Convert from kobo
            exchange_rate: 0.5,
            payment_channel: data.channel,
            paid_at: data.paid_at,
            webhook_processed: true,
            customer_email: email,
          },
        })
        .select()
        .single()

      if (transactionError) {
        console.error("Error creating transaction from webhook:", transactionError)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }

      console.log("Webhook processed successfully:", {
        reference,
        user_id: user.id,
        coin_amount: coinAmount,
        transaction_id: transaction.id,
      })

      return NextResponse.json(
        {
          message: "Webhook processed successfully",
          transaction_id: transaction.id,
        },
        { status: 200 },
      )
    }

    // Handle other webhook events if needed
    console.log("Unhandled webhook event:", event.event)
    return NextResponse.json({ message: "Event not handled" }, { status: 200 })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
