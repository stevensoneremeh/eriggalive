import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdmin } from "@/lib/admin-auth"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Check admin access
    await requireAdmin(user.id, user.email)

    // Get withdrawal requests with user and bank account details
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from("withdrawals")
      .select(`
        *,
        users!inner(id, username, full_name, email),
        bank_accounts!inner(account_name, account_number, bank_name, bank_code)
      `)
      .order("created_at", { ascending: false })

    if (withdrawalsError) {
      throw withdrawalsError
    }

    return NextResponse.json({ withdrawals })
  } catch (error) {
    console.error("Admin withdrawals error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Check admin access
    await requireAdmin(user.id, user.email)

    const { withdrawalId, action, reason } = await request.json()

    if (!withdrawalId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Update withdrawal status
    const { data: withdrawal, error: updateError } = await supabase
      .from("withdrawals")
      .update({
        status: action === "approve" ? "approved" : "rejected",
        admin_notes: reason || null,
        processed_at: new Date().toISOString(),
        processed_by: user.id,
      })
      .eq("id", withdrawalId)
      .select("*, users!inner(id, username, coins)")
      .single()

    if (updateError) {
      throw updateError
    }

    // If approved, deduct coins from user balance
    if (action === "approve") {
      const { error: balanceError } = await supabase
        .from("users")
        .update({
          coins: withdrawal.users.coins - withdrawal.amount_coins,
        })
        .eq("id", withdrawal.user_id)

      if (balanceError) {
        console.error("Failed to deduct coins:", balanceError)
        // Revert withdrawal status if coin deduction fails
        await supabase.from("withdrawals").update({ status: "pending" }).eq("id", withdrawalId)

        throw new Error("Failed to process coin deduction")
      }
    }

    return NextResponse.json({
      success: true,
      withdrawal,
      message: `Withdrawal ${action}d successfully`,
    })
  } catch (error) {
    console.error("Admin withdrawal action error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
