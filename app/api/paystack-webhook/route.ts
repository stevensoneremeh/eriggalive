import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const secret = process.env.PAYSTACK_SECRET_KEY!

async function handle(body: any) {
  const event = body.event
  if (event !== "charge.success") return

  const reference = body.data?.reference
  const amountKobo = body.data?.amount // kobo
  const email = body.data?.customer?.email

  if (!reference || !amountKobo || !email) return

  // Idempotency check
  const { error: txErr } = await supabase.from("transactions").insert({
    reference,
    amount: amountKobo,
    status: "success",
    raw: body,
  })

  if (txErr && txErr.code === "23505") {
    // Already processed
    return
  }
  if (txErr) throw txErr

  // Find user by email
  const { data: profile } = await supabase.from("profiles").select("id").eq("email", email).single()

  if (!profile) return

  const credit = Math.floor(amountKobo / 100) // convert to base currency units

  // Increment wallet balance atomically
  await supabase.rpc("increment_wallet_balance", {
    p_user_id: profile.id,
    p_delta: credit,
  })
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const signature = req.headers.get("x-paystack-signature") || ""

  const hash = crypto.createHmac("sha512", secret).update(raw).digest("hex")

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  try {
    await handle(JSON.parse(raw))
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("Webhook error:", e)
    return NextResponse.json({ error: "Webhook error" }, { status: 500 })
  }
}
