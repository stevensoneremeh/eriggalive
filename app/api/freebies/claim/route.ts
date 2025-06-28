import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { freebieId, shippingAddress } = body

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Get freebie details
    const { data: freebie, error: freebieError } = await supabase
      .from("freebies")
      .select("*")
      .eq("id", freebieId)
      .single()

    if (freebieError || !freebie) {
      return NextResponse.json({ error: "Freebie not found" }, { status: 404 })
    }

    // Check tier access
    const tierLevels = { grassroot: 0, pioneer: 1, elder: 2, blood: 3 }
    const userTierLevel = tierLevels[profile.tier]
    const requiredTierLevel = tierLevels[freebie.required_tier]

    if (userTierLevel < requiredTierLevel) {
      return NextResponse.json(
        {
          error: `This freebie requires ${freebie.required_tier} tier or higher`,
        },
        { status: 403 },
      )
    }

    // Check stock availability
    if (freebie.stock_quantity <= 0) {
      return NextResponse.json({ error: "This freebie is out of stock" }, { status: 400 })
    }

    // Check if user has already claimed this freebie
    const { data: existingClaim } = await supabase
      .from("freebie_claims")
      .select("*")
      .eq("user_id", profile.id)
      .eq("freebie_id", freebieId)
      .single()

    if (existingClaim) {
      return NextResponse.json({ error: "You have already claimed this freebie" }, { status: 400 })
    }

    // Check user's total claims for this freebie
    const { data: userClaims } = await supabase
      .from("freebie_claims")
      .select("id")
      .eq("user_id", profile.id)
      .eq("freebie_id", freebieId)

    if (userClaims && userClaims.length >= freebie.max_per_user) {
      return NextResponse.json(
        {
          error: `You can only claim this freebie ${freebie.max_per_user} time(s)`,
        },
        { status: 400 },
      )
    }

    // Create claim request
    const { data: claim, error: claimError } = await supabase
      .from("freebie_claims")
      .insert({
        user_id: profile.id,
        freebie_id: freebieId,
        status: "pending",
        shipping_address: shippingAddress,
        claimed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (claimError) {
      console.error("Error creating claim:", claimError)
      return NextResponse.json({ error: "Failed to create claim" }, { status: 500 })
    }

    // Update freebie stock and claim count
    await supabase
      .from("freebies")
      .update({
        stock_quantity: freebie.stock_quantity - 1,
        claim_count: freebie.claim_count + 1,
        total_claims: freebie.total_claims + 1,
      })
      .eq("id", freebieId)

    return NextResponse.json({ claim, success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
