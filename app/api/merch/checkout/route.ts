import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check feature flag
    const featureEnabled = process.env.FEATURE_PAYSTACK_MERCH === "true"
    if (!featureEnabled) {
      return NextResponse.json({ error: "Feature not available" }, { status: 403 })
    }

    const { itemId, itemName, deliveryAddress } = await request.json()

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    // Fixed preorder price
    const price = Number(process.env.MERCH_PREORDER_PRICE) || 80000
    const amountInKobo = price * 100

    // Generate unique reference
    const reference = `merch_${Date.now()}_${user.id.slice(0, 8)}`

    // Initialize Paystack transaction
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: amountInKobo,
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/merch/verify?reference=${reference}`,
        metadata: {
          user_id: user.id,
          item_id: itemId,
          item_name: itemName,
          order_type: "preorder",
        },
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok) {
      console.error("Paystack initialization failed:", paystackData)
      return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 })
    }

    // Store pending order in database
    const { error: dbError } = await supabase.from("merch_orders").insert({
      user_id: user.id,
      reference,
      status: "pending",
      amount: price,
      item_id: itemId,
      item_name: itemName || "Preorder Item",
      delivery_address: deliveryAddress,
      metadata: {
        paystack_reference: reference,
        item_details: { itemId, itemName },
      },
    })

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      reference,
    })
  } catch (error) {
    console.error("Merch checkout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
