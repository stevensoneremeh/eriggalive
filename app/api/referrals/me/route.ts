import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[referrals/me] Auth error:", authError)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to get referral code
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, username, referral_code, referral_count")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError) {
      console.error("[referrals/me] Profile fetch error:", profileError)
      
      // If user profile doesn't exist, create it
      if (profileError.code === "PGRST116") {
        const username = user.email?.split("@")[0] || "user"
        const referralCode = `${username}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase()
        
        try {
          const { data: newUser, error: createError } = await supabase
            .from("users")
            .insert({
              auth_user_id: user.id,
              email: user.email,
              username: username,
              referral_code: referralCode,
              referral_count: 0,
              full_name: username,
              coins: 0,
              points: 0,
              level: 1,
              tier: 'grassroot',
              is_verified: false,
              is_profile_public: true,
              reputation_score: 0,
              profile_completeness: 20
            })
            .select("id, username, referral_code, referral_count")
            .single()

          if (createError) {
            console.error("[referrals/me] Error creating user profile:", createError)
            return NextResponse.json({ success: false, error: "Failed to create user profile" }, { status: 500 })
          }

          return NextResponse.json({
            success: true,
            referralCode: newUser.referral_code,
            referralCount: newUser.referral_count || 0,
            referralUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://eriggalive.com'}/signup?ref=${newUser.referral_code}`
          })
        } catch (createErr) {
          console.error("[referrals/me] Error in user creation:", createErr)
          return NextResponse.json({ success: false, error: "Failed to create user profile" }, { status: 500 })
        }
      }
      
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 })
    }

    // Generate referral code if none exists
    let referralCode = profile.referral_code
    if (!referralCode) {
      referralCode = `${profile.username || 'user'}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase()

      try {
        const { error: updateError } = await supabase
          .from("users")
          .update({ referral_code: referralCode })
          .eq("auth_user_id", user.id)

        if (updateError) {
          console.error("[referrals/me] Error updating user with referral code:", updateError)
          return NextResponse.json({ success: false, error: "Failed to update referral code" }, { status: 500 })
        }
      } catch (updateErr) {
        console.error("[referrals/me] Error in referral code update:", updateErr)
        return NextResponse.json({ success: false, error: "Failed to update referral code" }, { status: 500 })
      }
    }

    // Get referral count - try from user_referrals table first, fallback to user table
    let referralCount = profile.referral_count || 0
    
    try {
      const { data: referrals, error: referralError } = await supabase
        .from("user_referrals")
        .select("id")
        .eq("referrer_id", profile.id)

      if (!referralError && referrals) {
        referralCount = referrals.length
        
        // Update the referral count in users table if it's different
        if (referralCount !== (profile.referral_count || 0)) {
          await supabase
            .from("users")
            .update({ referral_count: referralCount })
            .eq("id", profile.id)
        }
      } else if (referralError) {
        console.warn("[referrals/me] Warning fetching referrals:", referralError.message)
        // Keep using the referral_count from users table or default to 0
      }
    } catch (error) {
      console.warn("[referrals/me] Referrals table query failed, using fallback count")
      // Use the referral_count from users table
    }

    return NextResponse.json({
      success: true,
      referralCode,
      referralCount,
      referralUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://eriggalive.com'}/signup?ref=${referralCode}`
    })
  } catch (error) {
    console.error("[referrals/me] Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}
