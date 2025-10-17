import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

const secret = process.env.PAYSTACK_SECRET_KEY!

async function handle(body: any) {
  const event = body.event

  if (!["charge.success", "transfer.success", "subscription.create"].includes(event)) {
    console.log(`Ignoring unhandled event: ${event}`)
    return
  }

  const reference = body.data?.reference
  const amountKobo = body.data?.amount // kobo
  const email = body.data?.customer?.email
  const status = body.data?.status
  const metadata = body.data?.metadata || {}

  if (!reference || !amountKobo || !email) {
    console.error("Missing required webhook data:", { reference, amountKobo, email })
    return
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Check for existing transaction
  const { data: existingTx, error: checkError } = await supabase
    .from("transactions")
    .select("id, status, reference_type, reference_id")
    .eq("paystack_reference", reference)
    .single()

  if (checkError && checkError.code !== "PGRST116") {
    console.error("Error checking existing transaction:", checkError)
    throw checkError
  }

  if (existingTx && existingTx.status === "completed") {
    console.log(`Transaction already processed successfully: ${reference}`)
    return
  }

  // Only process successful payments
  if (status !== "success") {
    console.log(`Ignoring non-successful payment: ${reference} - ${status}`)
    return
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, email, coins, wallet")
    .eq("email", email)
    .single()

  if (profileError || !profile) {
    console.error(`User profile not found for email: ${email}`, profileError)
    return
  }

  try {
    // Handle different types of purchases based on metadata
    if (metadata.purchase_type === "ticket") {
      // Ticket purchase - already handled by ticket purchase API
      console.log(`Ticket purchase webhook processed: ${reference}`)
    } else if (metadata.purchase_type === "membership") {
      // Membership purchase - already handled by membership purchase API
      console.log(`Membership purchase webhook processed: ${reference}`)
    } else if (metadata.coin_purchase || metadata.purchase_type === "coins") {
      // Coin purchase
      const coinsToCredit = metadata.coins_amount || Math.floor((amountKobo / 100) * 2) // Default 2:1 ratio

      const { error: coinError } = await supabase.rpc("update_user_coins", {
        user_id: profile.id,
        amount: coinsToCredit,
      })

      if (coinError) {
        console.error("Error updating coin balance:", coinError)
        throw coinError
      }

      // Create coin transaction record
      await supabase.from("transactions").insert({
        user_id: profile.id,
        type: "purchase",
        category: "coins",
        amount_naira: amountKobo / 100,
        amount_coins: coinsToCredit,
        payment_method: "paystack",
        paystack_reference: reference,
        status: "completed",
        description: `Purchased ${coinsToCredit.toLocaleString()} Erigga Coins`,
        metadata: { webhook_processed: true, ...metadata },
      })

      console.log(`Coin purchase processed: ${reference} - ${coinsToCredit} coins credited`)
    } else {
      // Default wallet credit for other purchases
      const credit = Math.floor(amountKobo / 100)

      const { error: walletError } = await supabase.rpc("update_user_wallet", {
        user_id: profile.id,
        amount: credit,
      })

      if (walletError) {
        console.error("Error updating wallet balance:", walletError)
        throw walletError
      }

      // Create wallet transaction record
      await supabase.from("transactions").insert({
        user_id: profile.id,
        type: "deposit",
        category: "other",
        amount_naira: credit,
        payment_method: "paystack",
        paystack_reference: reference,
        status: "completed",
        description: `Wallet deposit via Paystack`,
        metadata: { webhook_processed: true, ...metadata },
      })

      console.log(`Wallet deposit processed: ${reference} - ₦${credit} credited`)
    }

    console.log(`Successfully processed webhook: ${reference} for ${email}`)
  } catch (error) {
    console.error("Error processing payment:", error)
    throw error
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const signature = req.headers.get("x-paystack-signature") || ""

  if (!secret) {
    console.error("Paystack secret key not configured")
    return NextResponse.json({ error: "Configuration error" }, { status: 500 })
  }

  const hash = crypto.createHmac("sha512", secret).update(raw).digest("hex")

  if (hash !== signature) {
    console.error("Invalid webhook signature", {
      expected: hash.substring(0, 10) + "...",
      received: signature.substring(0, 10) + "...",
    })
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  try {
    const parsedBody = JSON.parse(raw)
    await handle(parsedBody)
    return NextResponse.json({
      ok: true,
      message: "Webhook processed successfully",
      event: parsedBody.event,
      reference: parsedBody.data?.reference,
    })
  } catch (e: any) {
    console.error("Webhook processing error:", e)
    return NextResponse.json(
      {
        error: "Webhook processing failed",
        details: e.message,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Paystack webhook endpoint is active",
    timestamp: new Date().toISOString(),
  })
}
