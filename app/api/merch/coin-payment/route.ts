import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { cart, customerInfo, userId } = await request.json()

    if (!cart || !customerInfo || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Calculate total coin cost
    const totalCoins = cart.reduce((sum: number, item: any) => sum + item.product.coin_price * item.quantity, 0)

    // Check user's coin balance
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("coin_balance")
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("User fetch error:", userError)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    if (!user || user.coin_balance < totalCoins) {
      return NextResponse.json({ error: "Insufficient coin balance" }, { status: 400 })
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total_amount: 0, // No cash amount
        coin_amount: totalCoins,
        payment_method: "coins",
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
      price: 0, // No cash price
      coin_price: item.product.coin_price,
      created_at: new Date().toISOString(),
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("Order items error:", itemsError)
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 })
    }

    // Deduct coins from user balance
    const { error: balanceError } = await supabase
      .from("users")
      .update({
        coin_balance: user.coin_balance - totalCoins,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (balanceError) {
      console.error("Balance update error:", balanceError)
      return NextResponse.json({ error: "Failed to update coin balance" }, { status: 500 })
    }

    // Record coin transaction
    const { error: transactionError } = await supabase.from("coin_transactions").insert({
      user_id: userId,
      amount: -totalCoins,
      type: "purchase",
      description: `Merch purchase - Order #${order.id}`,
      reference: `order_${order.id}`,
      created_at: new Date().toISOString(),
    })

    if (transactionError) {
      console.error("Transaction record error:", transactionError)
      // Don't fail the request for transaction logging errors
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      coinsDeducted: totalCoins,
      newBalance: user.coin_balance - totalCoins,
      message: "Coin payment processed successfully",
    })
  } catch (error) {
    console.error("Coin payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
