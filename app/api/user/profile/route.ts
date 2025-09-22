import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get or create user profile
    let { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !profile) {
      console.log("Profile not found, creating new profile for user:", user.id)
      
      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from("users")
        .insert({
          auth_user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          avatar_url: user.user_metadata?.avatar_url || null,
          tier: 'erigga_citizen',
          coins: 100, // Welcome bonus
          points: 0,
          level: 1,
          reputation_score: 0,
          is_active: true,
          is_verified: false,
          profile_completeness: 25,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select("*")
        .single()

      if (createError || !newProfile) {
        console.error("Error creating profile:", createError)
        
        // Return fallback profile if creation fails
        const fallbackProfile = {
          id: user.id,
          auth_user_id: user.id,
          email: user.email,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || null,
          tier: 'erigga_citizen',
          coins: 100,
          points: 0,
          level: 1,
          reputation_score: 0,
          is_active: true,
          is_verified: false,
          profile_completeness: 25,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        return NextResponse.json({
          profile: { ...fallbackProfile, email: user.email },
          success: true,
          fallback: true
        })
      }
      
      profile = newProfile
    }

    // Calculate profile completeness
    let completeness = 0
    const fields = ['username', 'full_name', 'avatar_url', 'bio', 'date_of_birth', 'location']
    fields.forEach(field => {
      if (profile[field]) completeness += 100 / fields.length
    })
    
    profile.profile_completeness = Math.round(completeness)

    return NextResponse.json({
      profile: { ...profile, email: user.email },
      success: true,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
