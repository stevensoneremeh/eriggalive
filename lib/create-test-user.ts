import { createAdminSupabaseClient } from "@/lib/supabase/server"

export async function createTestUser() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("This function should only be used in development mode")
  }

  const adminClient = createAdminSupabaseClient()

  // Create auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: "test@example.com",
    password: "password123",
    email_confirm: true,
  })

  if (authError) {
    console.error("Error creating auth user:", authError)
    return { success: false, error: authError.message }
  }

  // Create profile
  const { error: profileError } = await adminClient.from("users").insert([
    {
      auth_user_id: authData.user.id,
      username: "testuser",
      full_name: "Test User",
      email: "test@example.com",
      tier: "pioneer",
      role: "user",
      level: 3,
      points: 2500,
      coins: 500,
      is_verified: true,
      is_active: true,
      is_banned: false,
      login_count: 1,
      email_verified: true,
      phone_verified: false,
      two_factor_enabled: false,
      preferences: {},
      metadata: {},
    },
  ])

  if (profileError) {
    console.error("Error creating profile:", profileError)
    return { success: false, error: profileError.message }
  }

  return { success: true, userId: authData.user.id }
}
