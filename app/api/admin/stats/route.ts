import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const adminSupabase = createAdminSupabaseClient()

    // Check authentication with proper error handling
    let user = null
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.error("Auth error:", authError)
        return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
      }

      user = authUser
    } catch (error) {
      console.error("Failed to get user:", error)
      return NextResponse.json({ error: "Authentication service unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to check admin privileges with null guards
    let profile = null
    try {
      const { data: profileData } = await supabase
        .from("users")
        .select("tier, role")
        .eq("auth_user_id", user.id)
        .single()
      profile = profileData
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    }

    if (!profile || (profile.tier === "grassroot" && profile.role !== "admin")) {
      return NextResponse.json({ error: "Insufficient privileges" }, { status: 403 })
    }

    // Get user statistics with null guards
    const { data: allUsers } = await adminSupabase.from("users").select("tier, created_at, last_login")

    const today = new Date().toISOString().split("T")[0]
    const userStats = {
      total: allUsers?.length || 0,
      new_today: allUsers?.filter((u) => u.created_at?.startsWith(today)).length || 0,
      active_today: allUsers?.filter((u) => u.last_login?.startsWith(today)).length || 0,
      by_tier:
        allUsers?.reduce((acc: Record<string, number>, user) => {
          if (user.tier) {
            acc[user.tier] = (acc[user.tier] || 0) + 1
          }
          return acc
        }, {}) || {},
    }

    // Get content statistics with proper error handling
    let contentStats = {
      albums: 0,
      tracks: 0,
      videos: 0,
      gallery: 0,
    }

    try {
      const [albums, tracks, videos, gallery] = await Promise.all([
        adminSupabase.from("albums").select("id", { count: "exact", head: true }),
        adminSupabase.from("tracks").select("id", { count: "exact", head: true }),
        adminSupabase.from("music_videos").select("id", { count: "exact", head: true }),
        adminSupabase.from("gallery_items").select("id", { count: "exact", head: true }),
      ])

      contentStats = {
        albums: albums.count || 0,
        tracks: tracks.count || 0,
        videos: videos.count || 0,
        gallery: gallery.count || 0,
      }
    } catch (error) {
      console.error("Failed to fetch content stats:", error)
    }

    // Get engagement statistics with null guards
    let engagementStats = {
      total_plays: 0,
      total_likes: 0,
      total_votes: 0,
      total_comments: 0,
    }

    try {
      const [trackPlays, albumLikes, communityVotes, communityComments] = await Promise.all([
        adminSupabase.from("tracks").select("play_count"),
        adminSupabase.from("albums").select("like_count"),
        adminSupabase.from("community_post_votes").select("post_id", { count: "exact", head: true }),
        adminSupabase.from("community_comments").select("id", { count: "exact", head: true }),
      ])

      engagementStats = {
        total_plays: trackPlays.data?.reduce((sum, track) => sum + (track.play_count || 0), 0) || 0,
        total_likes: albumLikes.data?.reduce((sum, album) => sum + (album.like_count || 0), 0) || 0,
        total_votes: communityVotes.count || 0,
        total_comments: communityComments.count || 0,
      }
    } catch (error) {
      console.error("Failed to fetch engagement stats:", error)
    }

    // Get revenue statistics with null guards
    let revenueStats = {
      total_coins_purchased: 0,
      total_revenue: 0,
      pending_withdrawals: 0,
    }

    try {
      const { data: coinTransactions } = await adminSupabase
        .from("coin_transactions")
        .select("amount, transaction_type, status")

      if (coinTransactions) {
        revenueStats = {
          total_coins_purchased:
            coinTransactions
              .filter((t) => t.transaction_type === "purchase" && t.status === "completed")
              .reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
          total_revenue:
            coinTransactions
              .filter((t) => t.transaction_type === "purchase" && t.status === "completed")
              .reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
          pending_withdrawals:
            coinTransactions
              .filter((t) => t.transaction_type === "withdrawal" && t.status === "pending")
              .reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
        }
      }
    } catch (error) {
      console.error("Failed to fetch revenue stats:", error)
    }

    const stats = {
      users: userStats,
      content: contentStats,
      engagement: engagementStats,
      revenue: revenueStats,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
