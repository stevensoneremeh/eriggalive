import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-utils"

// Check if we're in preview/development mode
const isPreviewMode = () => {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.VERCEL_ENV === "preview" ||
    !process.env.PAYSTACK_SECRET_KEY ||
    process.env.PAYSTACK_SECRET_KEY.startsWith("pk_test_")
  )
}

// Mock Paystack verification for preview mode
async function mockPaystackVerification(reference: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    status: true,
    data: {
      status: "success",
      amount: 250000, // 2500 NGN in kobo
      reference,
      paid_at: new Date().toISOString(),
      channel: "card",
      currency: "NGN",
      customer: {
        email: "user@example.com",
      },
    },
  }
}

// Real Paystack verification for production
async function verifyWithPaystack(reference: string, paystackSecretKey: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Paystack API error: ${response.status} - ${response.statusText}`)
  }

  return await response.json()
}

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json()

    if (!reference) {
      return NextResponse.json({ success: false, error: "Payment reference is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("reference", reference)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 })
    }

    // If already completed, return success
    if (payment.status === "completed") {
      return NextResponse.json({ success: true, payment })
    }

    // Verify with Paystack
    let paystackData
    try {
      if (isPreviewMode()) {
        console.log("Using mock Paystack verification for preview mode")
        paystackData = await mockPaystackVerification(reference)
      } else {
        const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
        if (!paystackSecretKey) {
          return NextResponse.json({ success: false, error: "Payment gateway configuration error" }, { status: 500 })
        }

        paystackData = await verifyWithPaystack(reference, paystackSecretKey)
      }

      if (!paystackData.status || paystackData.data.status !== "success") {
        // Update payment status to failed
        await supabase
          .from("payments")
          .update({
            status: "failed",
            processed_at: new Date().toISOString(),
            metadata: { ...payment.metadata, paystack_response: paystackData },
          })
          .eq("id", payment.id)

        return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 })
      }

      // Update payment status to completed
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          status: "completed",
          paystack_reference: paystackData.data.reference,
          processed_at: new Date().toISOString(),
          metadata: { ...payment.metadata, paystack_response: paystackData.data },
        })
        .eq("id", payment.id)

      if (updateError) {
        console.error("Error updating payment:", updateError)
        return NextResponse.json({ success: false, error: "Failed to update payment status" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        payment: { ...payment, status: "completed" },
        isPreviewMode: isPreviewMode(),
      })
    } catch (error) {
      console.error("Payment verification error:", error)

      // Update payment status to failed
      await supabase
        .from("payments")
        .update({
          status: "failed",
          processed_at: new Date().toISOString(),
          metadata: { ...payment.metadata, error: error instanceof Error ? error.message : "Unknown error" },
        })
        .eq("id", payment.id)

      return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("Verify payment API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
