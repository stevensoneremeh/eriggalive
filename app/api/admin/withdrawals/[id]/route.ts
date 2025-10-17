import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function verifyAdminAccess(request: NextRequest) {
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
      .from("users")
      .select("id, email, username, role, tier")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !profile) {
      return { error: "User profile not found", user: null, profile: null }
    }

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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const withdrawalId = params.id
    if (!withdrawalId) {
      return NextResponse.json(
        {
          success: false,
          error: "Withdrawal ID is required",
          code: "INVALID_REQUEST",
        },
        { status: 400 },
      )
    }

    let requestData
    try {
      requestData = await request.json()
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          code: "INVALID_JSON",
        },
        { status: 400 },
      )
    }

    const { action, reason } = requestData

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Must be 'approve' or 'reject'",
          code: "INVALID_ACTION",
        },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    // Get the withdrawal request
    const { data: withdrawal, error: fetchError } = await supabase
      .from("withdrawals")
      .select(`
        *,
        users!inner (
          id,
          username,
          email,
          coins
        )
      `)
      .eq("id", withdrawalId)
      .single()

    if (fetchError || !withdrawal) {
      return NextResponse.json(
        {
          success: false,
          error: "Withdrawal request not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      )
    }

    if (withdrawal.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: "Withdrawal request has already been processed",
          code: "ALREADY_PROCESSED",
        },
        { status: 400 },
      )
    }

    const newStatus = action === "approve" ? "approved" : "rejected"

    // Update withdrawal status
    const { data: updatedWithdrawal, error: updateError } = await supabase
      .from("withdrawals")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        admin_notes: reason || `${action}d by admin`,
        processed_by: profile.id,
        processed_at: new Date().toISOString(),
      })
      .eq("id", withdrawalId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating withdrawal:", updateError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update withdrawal status",
          code: "UPDATE_ERROR",
        },
        { status: 500 },
      )
    }

    // If rejected, credit the coins back to the user
    if (action === "reject") {
      const { error: coinUpdateError } = await supabase
        .from("users")
        .update({
          coins: withdrawal.users.coins + withdrawal.amount_coins,
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawal.users.id)

      if (coinUpdateError) {
        console.error("Error crediting coins back:", coinUpdateError)
        // Log this error but don't fail the request since the withdrawal was already updated
      }

      // Create a coin transaction record for the refund
      await supabase.from("coin_transactions").insert({
        user_id: withdrawal.users.id,
        amount: withdrawal.amount_coins,
        transaction_type: "refund",
        description: `Withdrawal rejected - coins refunded (${withdrawalId})`,
        status: "completed",
      })
    }

    // Create an audit log entry
    await supabase.from("admin_actions").insert({
      admin_id: profile.id,
      action_type: `withdrawal_${action}`,
      target_type: "withdrawal",
      target_id: withdrawalId,
      details: {
        withdrawal_amount: withdrawal.amount_coins,
        naira_amount: withdrawal.amount_naira,
        user_id: withdrawal.users.id,
        reason: reason || `${action}d by admin`,
      },
    })

    console.log(`Withdrawal ${withdrawalId} ${action}d by admin ${profile.username}`)

    return NextResponse.json({
      success: true,
      withdrawal: updatedWithdrawal,
      message: `Withdrawal ${action}d successfully`,
    })
  } catch (error) {
    console.error("Admin withdrawal action error:", error)
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
export async function GET() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}

export async function POST() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}
