import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function isAdminUser(userId: string, email?: string): Promise<boolean> {
  try {
    // Check environment variables for admin access
    const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || []
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(",").map((id) => id.trim()) || []

    // Check if user ID is in admin list
    if (adminUserIds.includes(userId)) {
      return true
    }

    // Check if email is in admin list
    if (email && adminEmails.includes(email)) {
      return true
    }

    // Check database for admin role
    const { data: profile } = await supabase.from("users").select("role, tier").eq("auth_user_id", userId).single()

    return profile?.role === "admin" || profile?.tier === "admin"
  } catch (error) {
    console.error("Admin auth check error:", error)
    return false
  }
}

export async function requireAdmin(userId: string, email?: string) {
  const isAdmin = await isAdminUser(userId, email)
  if (!isAdmin) {
    throw new Error("Admin access required")
  }
  return true
}
