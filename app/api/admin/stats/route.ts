import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

<<<<<<< HEAD
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const adminSupabase = createAdminSupabaseClient()
=======
// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const adminSupabase = await createAdminSupabaseClient()
>>>>>>> new

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to check admin privileges
    const { data: profile } = await supabase.from("users").select("tier, role").eq("auth_user_id", user.id).single()

    if (!profile || (profile.tier === "grassroot" && profile.role !== "admin")) {
      return NextResponse.json({ error: "Insufficient privileges" }, { status: 403 })
    }

    // Get user statistics
    const { data: allUsers } = await adminSupabase.from("users").select("tier, created_at, last_login")

    const today = new Date().toISOString().split("T")[0]
    const userStats = {
      total: allUsers?.length || 0,
      new_today: allUsers?.filter((u) => u.created_at.startsWith(today)).length || 0,
      active_today: allUsers?.filter((u) => u.last_login?.startsWith(today)).length || 0,
      by_tier:
        allUsers?.reduce((acc: Record<string, number>, user) => {
          acc[user.tier] = (acc[user.tier] || 0) + 1
          return acc
        }, {}) || {},
    }

    // Get content statistics
    const [albums, tracks, videos, gallery] = await Promise.all([
      adminSupabase.from("albums").select("id", { count: "exact", head: true }),
      adminSupabase.from("tracks").select("id", { count: "exact", head: true }),
      adminSupabase.from("music_videos").select("id", { count: "exact", head: true }),
      adminSupabase.from("gallery_items").select("id", { count: "exact", head: true }),
    ])

    const contentStats = {
      albums: albums.count || 0,
      tracks: tracks.count || 0,
      videos: videos.count || 0,
      gallery: gallery.count || 0,
    }

    // Get engagement statistics
    const [trackPlays, albumLikes, communityVotes, communityComments] = await Promise.all([
      adminSupabase.from("tracks").select("play_count"),
      adminSupabase.from("albums").select("like_count"),
      adminSupabase.from("community_post_votes").select("post_id", { count: "exact", head: true }),
      adminSupabase.from("community_comments").select("id", { count: "exact", head: true }),
    ])

    const engagementStats = {
      total_plays: trackPlays.data?.reduce((sum, track) => sum + (track.play_count || 0), 0) || 0,
      total_likes: albumLikes.data?.reduce((sum, album) => sum + (album.like_count || 0), 0) || 0,
      total_votes: communityVotes.count || 0,
      total_comments: communityComments.count || 0,
    }

    // Get revenue statistics
    const { data: coinTransactions } = await adminSupabase
      .from("coin_transactions")
      .select("amount, transaction_type, status")

    const revenueStats = {
      total_coins_purchased:
        coinTransactions
          ?.filter((t) => t.transaction_type === "purchase" && t.status === "completed")
          .reduce((sum, t) => sum + t.amount, 0) || 0,
      total_revenue:
        coinTransactions
          ?.filter((t) => t.transaction_type === "purchase" && t.status === "completed")
          .reduce((sum, t) => sum + t.amount, 0) || 0, // Assuming 1:1 coin to naira ratio for now
      pending_withdrawals:
        coinTransactions
          ?.filter((t) => t.transaction_type === "withdrawal" && t.status === "pending")
          .reduce((sum, t) => sum + t.amount, 0) || 0,
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
