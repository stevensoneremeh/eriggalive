import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Safe response wrapper
function createResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
  })
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    let data = []
    try {
      const result = await supabase
        .from("community_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (result.error) {
        console.error("Categories fetch error:", result.error)
        return createResponse({ error: "Failed to fetch categories", categories: [], count: 0 }, 500)
      }

      data = result.data || []
    } catch (fetchErr) {
      console.error("Categories fetch exception:", fetchErr)
      return createResponse({ error: "Database temporarily unavailable", categories: [], count: 0 }, 503)
    }

    const formattedCategories = data.map((category) => ({
      id: category.id,
      name: category.name || "Unnamed Category",
      slug: category.slug || "unnamed",
      icon: category.icon || "💬",
      color: category.color || "#6B7280",
      description: category.description || "",
      display_order: category.display_order || 0,
      is_active: category.is_active !== false,
      created_at: category.created_at,
      updated_at: category.updated_at,
    }))

    return createResponse({
      success: true,
      categories: formattedCategories,
      count: formattedCategories.length,
    })
  } catch (error) {
    console.error("Unhandled categories API error:", error)
    return createResponse({ error: "Internal server error", categories: [], count: 0 }, 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    let authUser = null
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) {
        return createResponse({ error: "Authentication required" }, 401)
      }
      authUser = user
    } catch (authErr) {
      console.error("Auth error:", authErr)
      return createResponse({ error: "Authentication failed" }, 401)
    }

    // Check admin status
    try {
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("tier, is_admin")
        .eq("auth_user_id", authUser.id)
        .single()

      if (profileError || !profile?.is_admin) {
        return createResponse({ error: "Admin access required" }, 403)
      }
    } catch (profileErr) {
      console.error("Profile check error:", profileErr)
      return createResponse({ error: "Access verification failed" }, 500)
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (parseErr) {
      return createResponse({ error: "Invalid request body" }, 400)
    }

    const { name, slug, icon, color, description } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return createResponse({ error: "Category name is required" }, 400)
    }

    if (!slug || typeof slug !== "string" || slug.trim().length === 0) {
      return createResponse({ error: "Category slug is required" }, 400)
    }

    // Insert category
    try {
      const { data: category, error: insertError } = await supabase
        .from("community_categories")
        .insert({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          icon: icon || "💬",
          color: color || "#6B7280",
          description: description?.trim() || "",
          is_active: true,
          display_order: 0,
        })
        .select("*")
        .single()

      if (insertError) {
        console.error("Category insert error:", insertError)
        return createResponse({ error: "Failed to create category" }, 500)
      }

      return createResponse({
        success: true,
        category,
      })
    } catch (insertErr) {
      console.error("Category insert exception:", insertErr)
      return createResponse({ error: "Failed to create category" }, 500)
    }
  } catch (error) {
    console.error("Unhandled category POST error:", error)
    return createResponse({ error: "Internal server error" }, 500)
  }
}
