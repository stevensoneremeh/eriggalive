"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function fetchCommunityPosts() {
  try {
    const supabase = await createClient()

    const { data: posts, error } = await supabase
      .from("community_posts")
      .select(`
        *,
        user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
        category:community_categories!community_posts_category_id_fkey(id, name, slug)
      `)
      .eq("is_published", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Error fetching posts:", error)
      return []
    }

    return posts || []
  } catch (error) {
    console.error("Error in fetchCommunityPosts:", error)
    return []
  }
}

export async function createCommunityPost(formData: FormData) {
  try {
    const supabase = await createClient()

    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const categoryId = formData.get("categoryId") as string

    if (!title || !content) {
      return { error: "Title and content are required" }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Authentication required" }
    }

    const { data: userProfile } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

    if (!userProfile) {
      return { error: "User profile not found" }
    }

    const { data: post, error } = await supabase
      .from("community_posts")
      .insert({
        title,
        content,
        user_id: userProfile.id,
        category_id: categoryId ? Number.parseInt(categoryId) : null,
        is_published: true,
        is_deleted: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating post:", error)
      return { error: "Failed to create post" }
    }

    revalidatePath("/community")
    return { success: true, post }
  } catch (error) {
    console.error("Error in createCommunityPost:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function fetchCommunityCategories() {
  try {
    const supabase = await createClient()

    const { data: categories, error } = await supabase
      .from("community_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching categories:", error)
      return []
    }

    return categories || []
  } catch (error) {
    console.error("Error in fetchCommunityCategories:", error)
    return []
  }
}
