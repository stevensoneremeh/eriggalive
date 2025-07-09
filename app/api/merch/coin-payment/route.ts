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

    const { items, customerInfo, totalCoins } = await request.json()

    // Get current user profile with coins
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("coins")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Check if user has enough coins
    if (profile.coins < totalCoins) {
      return NextResponse.json(
        {
          error: "Insufficient coins",
          required: totalCoins,
          available: profile.coins,
        },
        { status: 400 },
      )
    }

    // Generate reference for coin payment
    const reference = `coin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        reference: reference,
        total_amount: 0,
        total_coins: totalCoins,
        payment_status: "completed",
        order_status: "confirmed",
        customer_info: customerInfo,
        payment_data: { method: "coins", coins_used: totalCoins },
        metadata: { payment_method: "coins" },
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
      unit_price: 0,
      unit_coin_price: item.product.coin_price,
      payment_method: "coins",
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("Order items error:", itemsError)
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 })
    }

    // Deduct coins from user balance
    const { error: updateError } = await supabase
      .from("users")
      .update({
        coins: profile.coins - totalCoins,
        updated_at: new Date().toISOString(),
      })
      .eq("auth_user_id", user.id)

    if (updateError) {
      console.error("Coin deduction error:", updateError)
      return NextResponse.json({ error: "Failed to deduct coins" }, { status: 500 })
    }

    // Record coin transaction
    const { error: transactionError } = await supabase.from("coin_transactions").insert({
      user_id: user.id,
      type: "purchase",
      amount: -totalCoins,
      balance_before: profile.coins,
      balance_after: profile.coins - totalCoins,
      reference: reference,
      description: `Purchase of ${items.length} item(s)`,
      metadata: { order_id: order.id, items: items.length },
    })

    if (transactionError) {
      console.error("Transaction record error:", transactionError)
      // Don't fail the request for transaction recording error
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      coins_used: totalCoins,
      new_balance: profile.coins - totalCoins,
      message: "Coin payment processed successfully",
    })
  } catch (error) {
    console.error("Coin payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
