import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ticketingService } from "@/lib/services/ticketing"
import crypto from "crypto"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    // Verify webhook signature
    const paystackSecret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecret) {
      console.error("Paystack webhook secret not configured")
      return NextResponse.json({ error: "Configuration error" }, { status: 500 })
    }

    const hash = crypto.createHmac("sha512", paystackSecret).update(body).digest("hex")

    if (hash !== signature) {
      console.error("Invalid webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(body)
    console.log(`[Webhook] Received event: ${event.event}`)

    // Handle charge.success event
    if (event.event === "charge.success") {
      const { reference, amount, status, customer } = event.data

      if (status !== "success") {
        console.log(`[Webhook] Ignoring non-successful charge: ${reference}`)
        return NextResponse.json({ message: "Ignored non-successful charge" })
      }

      const supabase = createClient()

      // Find payment by reference
      const { data: payment, error: findError } = await supabase
        .from("payments")
        .select("*")
        .eq("provider_ref", reference)
        .single()

      if (findError || !payment) {
        console.error(`[Webhook] Payment not found for reference: ${reference}`)
        return NextResponse.json({ error: "Payment not found" }, { status: 404 })
      }

      // Check if already processed (idempotency)
      if (payment.status === "paid") {
        console.log(`[Webhook] Payment already processed: ${reference}`)
        return NextResponse.json({ message: "Already processed" })
      }

      // Verify amount matches
      const expectedAmountKobo = payment.amount_ngn * 100
      if (Math.abs(amount - expectedAmountKobo) > 100) {
        // Allow 1 NGN tolerance
        console.error(`[Webhook] Amount mismatch: expected ${expectedAmountKobo}, got ${amount}`)
        return NextResponse.json({ error: "Amount mismatch" }, { status: 400 })
      }

      // Update payment status
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          status: "paid",
          metadata: {
            ...payment.metadata,
            paystack_data: event.data,
            processed_at: new Date().toISOString(),
          },
        })
        .eq("id", payment.id)

      if (updateError) {
        console.error("[Webhook] Failed to update payment:", updateError)
        return NextResponse.json({ error: "Update failed" }, { status: 500 })
      }

      // Process based on context
      if (payment.context === "ticket") {
        try {
          // Create ticket
          const ticket = await ticketingService.createTicket(payment.metadata.event_id, payment.user_id, payment.id)

          console.log(`[Webhook] Ticket created: ${ticket.id}`)

          // Send real-time update to user
          await supabase.channel(`user:${payment.user_id}`).send({
            type: "broadcast",
            event: "ticket_created",
            payload: { ticket_id: ticket.id, payment_id: payment.id },
          })
        } catch (error) {
          console.error("[Webhook] Ticket creation failed:", error)
          // Mark payment as failed
          await supabase.from("payments").update({ status: "failed" }).eq("id", payment.id)
          return NextResponse.json({ error: "Ticket creation failed" }, { status: 500 })
        }
      } else if (payment.context === "membership") {
        try {
          const { tier_code, interval } = payment.metadata

          // Calculate months and final tier
          let finalTierCode = tier_code
          let months = 1

          if (tier_code === "ENT") {
            // Enterprise: check minimum amount
            const enterpriseMin = Number.parseInt(process.env.ENTERPRISE_MIN_NGN || "100000")
            if (payment.amount_ngn >= enterpriseMin) {
              months = 12 // Enterprise is always annual
            } else {
              // Map to Pro with calculated months
              finalTierCode = "PRO"
              const proMonthlyPrice = Number.parseInt(process.env.PRO_MONTHLY_PRICE_NGN || "10000")
              months = Math.max(1, Math.floor(payment.amount_ngn / proMonthlyPrice))
            }
          } else if (tier_code === "PRO") {
            switch (interval) {
              case "monthly":
                months = 1
                break
              case "quarterly":
                months = 3
                break
              case "yearly":
                months = 12
                break
              default:
                months = 1
            }
          }

          // Create/update membership
          const expiresAt = new Date()
          expiresAt.setMonth(expiresAt.getMonth() + months)

          const { error: membershipError } = await supabase.from("memberships").upsert(
            {
              user_id: payment.user_id,
              tier_code: finalTierCode,
              started_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
              status: "active",
              total_months_purchased: months,
            },
            {
              onConflict: "user_id",
            },
          )

          if (membershipError) {
            console.error("[Webhook] Membership creation failed:", membershipError)
            throw membershipError
          }

          // Credit wallet with coins (1000 per month)
          const coinsToCredit = months * 1000
          await ticketingService.creditWallet(payment.user_id, coinsToCredit, "membership_bonus", payment.id)

          console.log(`[Webhook] Membership activated: ${finalTierCode}, ${months} months, ${coinsToCredit} coins`)

          // Send real-time update
          await supabase.channel(`user:${payment.user_id}`).send({
            type: "broadcast",
            event: "membership_activated",
            payload: {
              tier_code: finalTierCode,
              months,
              coins_credited: coinsToCredit,
              payment_id: payment.id,
            },
          })
        } catch (error) {
          console.error("[Webhook] Membership processing failed:", error)
          await supabase.from("payments").update({ status: "failed" }).eq("id", payment.id)
          return NextResponse.json({ error: "Membership processing failed" }, { status: 500 })
        }
      }

      console.log(`[Webhook] Successfully processed payment: ${reference}`)
      return NextResponse.json({ message: "Processed successfully" })
    }

    // Handle other events
    console.log(`[Webhook] Unhandled event: ${event.event}`)
    return NextResponse.json({ message: "Event not handled" })
  } catch (error) {
    console.error("[Webhook] Processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Paystack webhook endpoint is active",
    timestamp: new Date().toISOString(),
  })
}
