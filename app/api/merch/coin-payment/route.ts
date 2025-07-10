import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customer_info, total_coins } = body

    if (!items || !customer_info || !total_coins) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
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

    // Get user's current coin balance
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("coins")
      .eq("auth_user_id", user.id)
      .single()

    if (userError) {
      console.error("User fetch error:", userError)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    const currentBalance = userData?.coins || 0

    // Check if user has enough coins
    if (currentBalance < total_coins) {
      return NextResponse.json(
        { error: `Insufficient coins. You have ${currentBalance} coins but need ${total_coins}` },
        { status: 400 },
      )
    }

    // Generate unique reference
    const reference = `coin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        reference: reference,
        total_amount: 0,
        total_coins: total_coins,
        payment_status: "completed",
        order_status: "confirmed",
        customer_info: customer_info,
        payment_data: {
          payment_method: "coins",
          coins_used: total_coins,
          balance_before: currentBalance,
          balance_after: currentBalance - total_coins,
        },
        metadata: {
          payment_method: "coins",
          processed_at: new Date().toISOString(),
        },
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
      unit_price: null,
      unit_coin_price: item.product.coin_price,
      payment_method: "coins",
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("Order items creation error:", itemsError)
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 })
    }

    // Deduct coins from user balance
    const { error: balanceError } = await supabase
      .from("users")
      .update({
        coins: currentBalance - total_coins,
        updated_at: new Date().toISOString(),
      })
      .eq("auth_user_id", user.id)

    if (balanceError) {
      console.error("Balance update error:", balanceError)
      return NextResponse.json({ error: "Failed to update coin balance" }, { status: 500 })
    }

    // Record coin transaction
    const { error: transactionError } = await supabase.from("coin_transactions").insert({
      user_id: user.id,
      type: "purchase",
      amount: -total_coins,
      balance_before: currentBalance,
      balance_after: currentBalance - total_coins,
      reference: reference,
      description: `Merch purchase - Order ${order.id}`,
      metadata: {
        order_id: order.id,
        items: items.map((item: any) => ({
          product_name: item.product.name,
          size: item.size,
          quantity: item.quantity,
          coin_price: item.product.coin_price,
        })),
      },
    })

    if (transactionError) {
      console.error("Transaction record error:", transactionError)
      // Don't fail the order for transaction record error
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      reference: reference,
      coins_used: total_coins,
      new_balance: currentBalance - total_coins,
    })
  } catch (error) {
    console.error("Coin payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
