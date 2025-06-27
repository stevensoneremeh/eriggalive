"use server"

const mod = () => import("./community-actions-final-fix")

export async function createPost(formData: FormData) {
  const { createCommunityPostAction } = await mod()
  return createCommunityPostAction(formData)
}

export async function voteOnPost(postId: number, postCreatorAuthId = "") {
  const { voteOnPostAction } = await mod()
  return voteOnPostAction(postId, postCreatorAuthId)
}

export async function bookmarkPost(postId: number) {
  const { bookmarkPost } = await mod()
  return bookmarkPost(postId)
}

export { createPost as createCommunityPostAction }
export { voteOnPost as voteOnPostAction }
export { bookmarkPost as bookmarkPostAction }

export async function fetchCommunityPosts(
  userId?: string,
  opts?: { categoryFilter?: number; sortOrder?: string; page?: number; limit?: number; searchQuery?: string },
) {
  const { fetchCommunityPosts } = await mod()
  return fetchCommunityPosts(userId, opts)
}

export async function createCommunity(formData: FormData) {
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server")
    const { getOrCreateUserProfile } = await import("@/lib/auth-sync")

    const supabase = await createServerSupabaseClient()
    const userProfile = await getOrCreateUserProfile()

    const name = formData.get("name") as string

    if (!name?.trim()) {
      return { success: false, error: "Community name is required" }
    }

    if (name.length < 3 || name.length > 255) {
      return { success: false, error: "Community name must be between 3 and 255 characters" }
    }

    const { data, error } = await supabase
      .from("communities")
      .insert({
        name: name.trim(),
        creator_id: userProfile.id,
        description: (formData.get("description") as string) || "",
      })
      .select()
      .single()

    if (error) {
      console.error("Create community error:", error)
      if (error.code === "23505") {
        return { success: false, error: "Community name already exists" }
      }
      return { success: false, error: error.message }
    }

    const { revalidatePath } = await import("next/cache")
    revalidatePath("/")

    return { success: true, community: data }
  } catch (error: any) {
    console.error("Create community action error:", error)
    return { success: false, error: error.message || "Failed to create community" }
  }
}

export async function updateCommunity(id: string, formData: FormData) {
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server")
    const { getOrCreateUserProfile } = await import("@/lib/auth-sync")

    const supabase = await createServerSupabaseClient()
    const userProfile = await getOrCreateUserProfile()

    const name = formData.get("name") as string

    if (!name?.trim()) {
      return { success: false, error: "Community name is required" }
    }

    if (name.length < 3 || name.length > 255) {
      return { success: false, error: "Community name must be between 3 and 255 characters" }
    }

    const { data, error } = await supabase
      .from("communities")
      .update({
        name: name.trim(),
        description: (formData.get("description") as string) || "",
      })
      .eq("id", id)
      .eq("creator_id", userProfile.id)
      .select()
      .single()

    if (error) {
      console.error("Update community error:", error)
      if (error.code === "23505") {
        return { success: false, error: "Community name already exists" }
      }
      return { success: false, error: error.message }
    }

    const { revalidatePath } = await import("next/cache")
    revalidatePath("/")

    return { success: true, community: data }
  } catch (error: any) {
    console.error("Update community action error:", error)
    return { success: false, error: error.message || "Failed to update community" }
  }
}

export async function deleteCommunity(id: string) {
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server")
    const { getOrCreateUserProfile } = await import("@/lib/auth-sync")

    const supabase = await createServerSupabaseClient()
    const userProfile = await getOrCreateUserProfile()

    const { error } = await supabase.from("communities").delete().eq("id", id).eq("creator_id", userProfile.id)

    if (error) {
      console.error("Delete community error:", error)
      return { success: false, error: error.message }
    }

    const { revalidatePath } = await import("next/cache")
    revalidatePath("/")

    return { success: true }
  } catch (error: any) {
    console.error("Delete community action error:", error)
    return { success: false, error: error.message || "Failed to delete community" }
  }
}
