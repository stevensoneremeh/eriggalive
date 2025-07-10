import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference, cash_items, customer_info } = body

    if (!reference || !cash_items || !customer_info) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok || !paystackData.status) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
    }

    const paymentData = paystackData.data

    // Calculate expected amount
    const expectedAmount = cash_items.reduce(
      (total: number, item: any) => total + item.product.price * item.quantity,
      0,
    )

    // Verify amount matches
    if (paymentData.amount !== expectedAmount * 100) {
      // Paystack amount is in kobo
      return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 })
    }

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        reference: reference,
        total_amount: expectedAmount,
        total_coins: 0,
        payment_status: "completed",
        order_status: "confirmed",
        customer_info: customer_info,
        payment_data: paymentData,
        metadata: {
          payment_method: "paystack",
          verified_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (orderError) {
      console.error("Order creation error:", orderError)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    // Create order items
    const orderItems = cash_items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      size: item.size,
      quantity: item.quantity,
      unit_price: item.product.price,
      unit_coin_price: null,
      payment_method: "cash",
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("Order items creation error:", itemsError)
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      reference: reference,
      amount: expectedAmount,
    })
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
