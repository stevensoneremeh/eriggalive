import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { freebie_id, shipping_address, notes } = body

    if (!freebie_id || !shipping_address) {
      return NextResponse.json({ error: "Freebie ID and shipping address are required" }, { status: 400 })
    }

    // Check if freebie exists and is active
    const { data: freebie, error: freebieError } = await supabase
      .from("freebies")
      .select("*")
      .eq("id", freebie_id)
      .eq("is_active", true)
      .single()

    if (freebieError || !freebie) {
      return NextResponse.json({ error: "Freebie not found or inactive" }, { status: 404 })
    }

    // Check if user has already claimed this freebie
    const { data: existingClaim, error: claimCheckError } = await supabase
      .from("freebie_claims")
      .select("id")
      .eq("user_id", user.id)
      .eq("freebie_id", freebie_id)
      .single()

    if (existingClaim) {
      return NextResponse.json({ error: "You have already claimed this freebie" }, { status: 400 })
    }

    // Check stock availability
    if (freebie.stock_quantity <= 0) {
      return NextResponse.json({ error: "This freebie is out of stock" }, { status: 400 })
    }

    // Get user profile to check tier eligibility
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("tier")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Check tier eligibility
    const tierOrder = { grassroot: 1, pioneer: 2, elder: 3, blood: 4 }
    const userTierLevel = tierOrder[userProfile.tier as keyof typeof tierOrder] || 1
    const requiredTierLevel = tierOrder[freebie.required_tier as keyof typeof tierOrder] || 1

    if (userTierLevel < requiredTierLevel) {
      return NextResponse.json(
        { error: `This freebie requires ${freebie.required_tier} tier or higher` },
        { status: 403 },
      )
    }

    // Create the claim
    const { data: claim, error: claimError } = await supabase
      .from("freebie_claims")
      .insert({
        user_id: user.id,
        freebie_id,
        shipping_address,
        notes,
        status: "pending",
      })
      .select()
      .single()

    if (claimError) {
      console.error("Error creating claim:", claimError)
      return NextResponse.json({ error: "Failed to create claim" }, { status: 500 })
    }

    // Update freebie claim count and stock
    await supabase
      .from("freebies")
      .update({
        claim_count: freebie.claim_count + 1,
        total_claims: freebie.total_claims + 1,
        stock_quantity: freebie.stock_quantity - 1,
      })
      .eq("id", freebie_id)

    return NextResponse.json({
      message: "Freebie claimed successfully",
      claim,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("freebie_claims")
      .select(`
        *,
        freebie:freebies(*)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: claims, error } = await query

    if (error) {
      console.error("Error fetching claims:", error)
      return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 })
    }

    return NextResponse.json({ claims })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
