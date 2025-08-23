import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function verifyUser(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Authentication required", user: null, profile: null }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return { error: "User profile not found", user: null, profile: null }
    }

    return { user, profile, error: null }
  } catch (error) {
    console.error("Authentication error:", error)
    return { error: "Authentication failed", user: null, profile: null }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, profile, error: authError } = await verifyUser(request)
    if (authError || !user || !profile) {
      return NextResponse.json({ success: false, error: authError || "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const type = searchParams.get("type")
    const category = searchParams.get("category")

    const supabase = await createClient()

    // Build query
    let query = supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (type) {
      query = query.eq("type", type)
    }
    if (category) {
      query = query.eq("category", category)
    }

    const { data: transactions, error: transactionsError } = await query

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError)
      return NextResponse.json({ success: false, error: "Failed to fetch transactions" }, { status: 500 })
    }

    // Get transaction count for pagination
    let countQuery = supabase.from("transactions").select("*", { count: "exact", head: true }).eq("user_id", user.id)

    if (type) {
      countQuery = countQuery.eq("type", type)
    }
    if (category) {
      countQuery = countQuery.eq("category", category)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error("Error counting transactions:", countError)
    }

    return NextResponse.json({
      success: true,
      transactions: transactions || [],
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
