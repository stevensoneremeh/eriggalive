import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reference, items, customerInfo, totalAmount } = await request.json()

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status || paystackData.data.status !== "success") {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
    }

    // Verify amount matches
    const paidAmount = paystackData.data.amount / 100 // Convert from kobo to naira
    if (Math.abs(paidAmount - totalAmount) > 0.01) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 })
    }

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        reference: reference,
        total_amount: totalAmount,
        total_coins: 0,
        payment_status: "completed",
        order_status: "confirmed",
        customer_info: customerInfo,
        payment_data: paystackData.data,
        metadata: { payment_method: "paystack" },
      })
      .select()
      .single()

    if (orderError) {
      console.error("Order creation error:", orderError)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      size: item.size,
      quantity: item.quantity,
      unit_price: item.product.price,
      unit_coin_price: 0,
      payment_method: "cash",
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("Order items error:", itemsError)
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      message: "Payment verified and order created successfully",
    })
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
