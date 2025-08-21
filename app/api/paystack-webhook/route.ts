import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

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

  if (!reference || !amountKobo || !email) {
    console.error("Missing required webhook data:", { reference, amountKobo, email })
    return
  }

  const { data: existingTx, error: checkError } = await supabase
    .from("transactions")
    .select("id, status")
    .eq("reference", reference)
    .single()

  if (checkError && checkError.code !== "PGRST116") {
    console.error("Error checking existing transaction:", checkError)
    throw checkError
  }

  if (existingTx) {
    if (existingTx.status === "success") {
      console.log(`Transaction already processed successfully: ${reference}`)
      return
    }
    // Update existing transaction instead of creating new one
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: status === "success" ? "success" : "failed",
        raw: body,
        updated_at: new Date().toISOString(),
      })
      .eq("reference", reference)

    if (updateError) {
      console.error("Error updating existing transaction:", updateError)
      throw updateError
    }
  } else {
    // Create new transaction record
    const { error: txErr } = await supabase.from("transactions").insert({
      reference,
      amount: amountKobo,
      status: status === "success" ? "success" : "failed",
      raw: body,
    })

    if (txErr) {
      console.error("Error creating transaction:", txErr)
      throw txErr
    }
  }

  // Only process successful payments
  if (status !== "success") {
    console.log(`Ignoring non-successful payment: ${reference} - ${status}`)
    return
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, coins")
    .eq("email", email)
    .single()

  if (profileError || !profile) {
    console.error(`User profile not found for email: ${email}`, profileError)
    return
  }

  const credit = Math.floor(amountKobo / 100) // convert to base currency units

  try {
    // Increment wallet balance atomically
    const { error: walletError } = await supabase.rpc("increment_wallet_balance", {
      p_user_id: profile.id,
      p_delta: credit,
    })

    if (walletError) {
      console.error("Error updating wallet balance:", walletError)
      throw walletError
    }

    if (body.data?.metadata?.coin_purchase) {
      const coinsToCredit = body.data.metadata.coins_amount || Math.floor(credit * 2) // Default 2:1 ratio

      const { error: coinError } = await supabase.rpc("increment_user_coins", {
        user_id: profile.id,
        coin_amount: coinsToCredit,
      })

      if (coinError) {
        console.error("Error updating coin balance:", coinError)
        // Don't throw here, wallet update was successful
      } else {
        // Create coin transaction record
        await supabase.from("coin_transactions").insert({
          user_id: profile.id,
          amount: coinsToCredit,
          transaction_type: "purchase",
          description: `Webhook: Purchased ${coinsToCredit.toLocaleString()} coins (${reference})`,
          status: "completed",
        })
      }
    }

    console.log(`Successfully processed webhook: ${reference} - ₦${credit} credited to ${email}`)
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
