import { createClient } from "@/lib/supabase/client"
import type { CommunityPost, CommunityCategory, User } from "@/types/database"

const supabase = createClient()

// Ultra-safe function to get or create user profile
export async function getOrCreateUserProfile(): Promise<User | null> {
  try {
    // Get current auth user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      console.error("Auth error:", authError)
      return null
    }

    // Try to get existing profile
    const { data: existingProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", authUser.id)
      .single()

    if (existingProfile && !profileError) {
      return existingProfile
    }

    // If profile doesn't exist, call the database function to create it
    const { data: createdProfile, error: createError } = await supabase.rpc("get_or_create_user_profile_safe", {
      user_auth_id: authUser.id,
    })

    if (createError) {
      console.error("Error creating profile:", createError)
      return null
    }

    return createdProfile
  } catch (error) {
    console.error("Error in getOrCreateUserProfile:", error)
    return null
  }
}

// Safe function to create a post
export async function createPost(content: string, categoryId: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Get or create user profile
    const userProfile = await getOrCreateUserProfile()

    if (!userProfile) {
      return { success: false, error: "Unable to get user profile" }
    }

    // Create the post
    const { data, error } = await supabase
      .from("community_posts")
      .insert({
        user_id: userProfile.id,
        category_id: categoryId,
        content: content,
        is_published: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating post:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in createPost:", error)
    return { success: false, error: "Failed to create post" }
  }
}

// Get posts with user info
export async function getPosts(): Promise<CommunityPost[]> {
  try {
    const { data, error } = await supabase
      .from("community_posts")
      .select(`
        *,
        user:users!community_posts_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          tier
        ),
        category:community_categories!community_posts_category_id_fkey (
          id,
          name,
          slug
        )
      `)
      .eq("is_published", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching posts:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getPosts:", error)
    return []
  }
}

// Get categories
export async function getCategories(): Promise<CommunityCategory[]> {
  try {
    const { data, error } = await supabase.from("community_categories").select("*").order("name")

    if (error) {
      console.error("Error fetching categories:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getCategories:", error)
    return []
  }
}

// Vote on a post
export async function voteOnPost(postId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const userProfile = await getOrCreateUserProfile()

    if (!userProfile) {
      return { success: false, error: "Unable to get user profile" }
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from("community_post_votes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", userProfile.id)
      .single()

    if (existingVote) {
      // Remove vote
      const { error: deleteError } = await supabase
        .from("community_post_votes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userProfile.id)

      if (deleteError) {
        return { success: false, error: deleteError.message }
      }
    } else {
      // Add vote
      const { error: insertError } = await supabase.from("community_post_votes").insert({
        post_id: postId,
        user_id: userProfile.id,
      })

      if (insertError) {
        return { success: false, error: insertError.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error voting on post:", error)
    return { success: false, error: "Failed to vote on post" }
  }
}
