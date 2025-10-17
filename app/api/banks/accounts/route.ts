import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Fetch user's bank accounts with bank details
    const { data: accounts, error } = await supabase
      .from("bank_accounts")
      .select(`
        *,
        nigerian_banks (
          bank_name,
          bank_type
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching bank accounts:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch bank accounts" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      accounts: accounts || [],
    })
  } catch (error) {
    console.error("Bank accounts API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const { accountId } = await request.json()

    if (!accountId) {
      return NextResponse.json({ success: false, error: "Account ID is required" }, { status: 400 })
    }

    // Check if account has pending withdrawals
    const { data: pendingWithdrawals } = await supabase
      .from("withdrawals")
      .select("id")
      .eq("bank_account_id", accountId)
      .in("status", ["pending", "processing"])

    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete account with pending withdrawals" },
        { status: 400 },
      )
    }

    // Delete the account
    const { error: deleteError } = await supabase
      .from("bank_accounts")
      .delete()
      .eq("id", accountId)
      .eq("user_id", user.id) // Ensure user can only delete their own accounts

    if (deleteError) {
      console.error("Error deleting bank account:", deleteError)
      return NextResponse.json({ success: false, error: "Failed to delete bank account" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Bank account deleted successfully",
    })
  } catch (error) {
    console.error("Delete bank account API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
