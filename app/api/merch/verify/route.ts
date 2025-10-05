import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/merch?error=missing_reference`)
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok) {
      console.error("Paystack verification failed:", paystackData)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/merch?error=verification_failed`)
    }

    const { data } = paystackData
    const expectedAmount = (Number(process.env.MERCH_PREORDER_PRICE) || 80000) * 100

    if (data.status === "success" && data.amount === expectedAmount) {
      // Update order status to paid
      const { error: updateError } = await supabase
        .from("merch_orders")
        .update({
          status: "paid",
          payment_reference: reference,
          payment_verified_at: new Date().toISOString(),
          metadata: {
            paystack_data: data,
            verified_at: new Date().toISOString(),
          },
        })
        .eq("reference", reference)

      if (updateError) {
        console.error("Failed to update order:", updateError)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/merch?error=update_failed`)
      }

      // Redirect to success page
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/merch?success=payment_completed`)
    } else {
      // Mark as failed
      await supabase
        .from("merch_orders")
        .update({
          status: "failed",
          metadata: {
            paystack_data: data,
            failure_reason: "Payment verification failed",
          },
        })
        .eq("reference", reference)

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/merch?error=payment_failed`)
    }
  } catch (error) {
    console.error("Merch verification error:", error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/merch?error=server_error`)
  }
}
