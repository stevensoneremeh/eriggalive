import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function verifyAdminAccess(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Authentication required", user: null, profile: null }
    }

    // Get user profile to check admin privileges
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, email, username, role, tier")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !profile) {
      return { error: "User profile not found", user: null, profile: null }
    }

    // Check if user has admin access (admin role OR blood_brotherhood tier)
    const hasAdminAccess = profile.role === "admin" || profile.tier === "blood_brotherhood"

    if (!hasAdminAccess) {
      return { error: "Insufficient privileges", user: null, profile: null }
    }

    return { user, profile, error: null }
  } catch (error) {
    console.error("Admin verification error:", error)
    return { error: "Authentication failed", user: null, profile: null }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, profile, error: authError } = await verifyAdminAccess(request)
    if (authError || !user || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: authError || "Unauthorized",
          code: "AUTH_ERROR",
        },
        { status: 401 },
      )
    }

    const supabase = await createClient()

    // Get withdrawal requests with user and bank account details
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from("withdrawals")
      .select(`
        *,
        users!inner (
          username,
          email,
          tier
        ),
        bank_accounts!inner (
          account_number,
          bank_name,
          account_name
        )
      `)
      .order("created_at", { ascending: false })

    if (withdrawalsError) {
      console.error("Error fetching withdrawals:", withdrawalsError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch withdrawal requests",
          code: "DATABASE_ERROR",
        },
        { status: 500 },
      )
    }

    // Calculate statistics
    const stats = {
      totalPendingWithdrawals: withdrawals?.filter((w) => w.status === "pending").length || 0,
      totalApprovedWithdrawals: withdrawals?.filter((w) => w.status === "approved").length || 0,
      totalRejectedWithdrawals: withdrawals?.filter((w) => w.status === "rejected").length || 0,
      totalWithdrawalAmount: withdrawals?.reduce((sum, w) => sum + (w.amount_naira || 0), 0) || 0,
      pendingAmount:
        withdrawals?.filter((w) => w.status === "pending").reduce((sum, w) => sum + (w.amount_naira || 0), 0) || 0,
    }

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals || [],
      stats,
    })
  } catch (error) {
    console.error("Admin withdrawals API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}
