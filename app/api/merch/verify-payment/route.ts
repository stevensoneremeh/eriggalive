import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { reference, cart, customerInfo, userId } = await request.json()

    if (!reference || !cart || !customerInfo || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    if (!paystackResponse.ok) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
    }

    const paystackData = await paystackResponse.json()

    if (paystackData.data.status !== "success") {
      return NextResponse.json({ error: "Payment was not successful" }, { status: 400 })
    }

    const supabase = await createClient()

    // Calculate total amount
    const totalAmount = cart.reduce((sum: number, item: any) => sum + item.product.price * item.quantity, 0)

    // Verify amount matches
    if (paystackData.data.amount !== totalAmount * 100) {
      // Paystack amount is in kobo
      return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 })
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total_amount: totalAmount,
        payment_method: "paystack",
        payment_reference: reference,
        status: "confirmed",
        customer_info: customerInfo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (orderError) {
      console.error("Order creation error:", orderError)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    // Create order items
    const orderItems = cart.map((item: any) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      size: item.size,
      price: item.product.price,
      created_at: new Date().toISOString(),
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("Order items error:", itemsError)
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: "Payment verified and order created successfully",
    })
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
