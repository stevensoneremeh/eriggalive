import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const FEATURE_UI_FIXES_V1 = process.env.NEXT_PUBLIC_FEATURE_UI_FIXES_V1 === "true"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          code: "AUTH_ERROR",
        },
        { status: 401 },
      )
    }

    // Get query parameters
    const url = new URL(request.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const offset = Number.parseInt(url.searchParams.get("offset") || "0")

    try {
      // Try to get transactions from database
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (transactionsError) {
        console.log("Transactions table not available:", transactionsError)
        return NextResponse.json({
          success: true,
          transactions: [],
          total: 0,
          hasMore: false,
        })
      }

      // Get total count
      const { count, error: countError } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      return NextResponse.json({
        success: true,
        transactions: transactions || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
        limit,
        offset,
      })
    } catch (error) {
      console.log("Wallet transactions feature not implemented")
      return NextResponse.json({
        success: true,
        transactions: [],
        total: 0,
        hasMore: false,
      })
    }
  } catch (error) {
    console.error("Wallet transactions API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    )
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405 },
  )
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405 },
  )
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405 },
  )
}
