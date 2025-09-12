"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { TablesInsert } from "@/types/database"

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

    const content = formData.get("content") as string
    const categoryIdString = formData.get("categoryId") as string

    // Validate required fields
    if (!content || !content.trim()) {
      return { error: "Content is required" }
    }

    if (!categoryIdString) {
      return { error: "Category is required" }
    }

    // Parse and validate categoryId as number
    const categoryId = Number.parseInt(categoryIdString, 10)
    if (isNaN(categoryId) || categoryId <= 0) {
      return { error: "Invalid category selected" }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Authentication required" }
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !userProfile) {
      console.error("Error fetching user profile:", profileError)
      return { error: "User profile not found" }
    }

    // Create insert payload with explicit typing to avoid type inference issues
    const insertData = {
      content: content.trim(),
      user_id: (userProfile as { id: number }).id,
      category_id: categoryId,
      is_published: true,
      is_deleted: false,
    } as const

    const { data: post, error } = await supabase
      .from("community_posts")
      .insert(insertData as any) // Temporary bypass for type issues
      .select(`
        *,
        user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
        category:community_categories!community_posts_category_id_fkey(id, name, slug)
      `)
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
