import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function verifyUser(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Authentication required", user: null, profile: null }
    }

    return { user, profile: null, error: null }
  } catch (error) {
    console.error("Authentication error:", error)
    return { error: "Authentication failed", user: null, profile: null }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await verifyUser(request)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: authError || "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const type = searchParams.get("type")
    const category = searchParams.get("category")

    const supabase = createClient()

    let query = supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (type) {
      query = query.eq("type", type)
    }

    const { data: transactions, error: transactionsError } = await query

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError)
      return NextResponse.json({ success: false, error: "Failed to fetch transactions" }, { status: 500 })
    }

    // Get transaction count for pagination
    let countQuery = supabase
      .from("wallet_transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (type) {
      countQuery = countQuery.eq("type", type)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error("Error counting transactions:", countError)
    }

    const formattedTransactions = (transactions || []).map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      category: "coins", // Default category for wallet transactions
      amount_naira: transaction.type === "bonus" ? null : Math.abs(transaction.amount),
      amount_coins: transaction.type === "bonus" ? transaction.amount : null,
      payment_method: "wallet",
      status: "completed",
      description: transaction.description || `${transaction.type} transaction`,
      created_at: transaction.created_at,
      reference_type: transaction.reference_id ? "membership" : null,
      metadata: transaction.metadata || {},
    }))

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    })
  } catch (error) {
    console.error("Transactions API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}
