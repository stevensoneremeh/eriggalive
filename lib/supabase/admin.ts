// Server-only Supabase admin client with service role key
// WARNING: Only use this in server-side code (API routes, server components)
// Never expose to client-side code as it bypasses RLS

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

let adminClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[ADMIN] Missing Supabase admin environment variables")
    throw new Error("Missing Supabase admin credentials. Set SUPABASE_SERVICE_ROLE_KEY")
  }

  // Use singleton pattern for admin client
  if (adminClient) {
    return adminClient
  }

  // Create admin client with service role key (bypasses RLS)
  adminClient = createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        "X-Client-Info": "eriggalive-admin",
      },
    },
  })

  return adminClient
}

// Helper functions for common admin operations

export async function getAdminClient() {
  return createAdminClient()
}

// Get user by ID (admin only)
export async function getUserById(userId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("users")
    .select("*")
    .eq("auth_user_id", userId)
    .single()

  if (error) {
    console.error("[ADMIN] Error fetching user:", error)
    return null
  }

  return data
}

// Get user by email (admin only)
export async function getUserByEmail(email: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("users")
    .select("*")
    .eq("email", email)
    .single()

  if (error) {
    console.error("[ADMIN] Error fetching user by email:", error)
    return null
  }

  return data
}

// Admin storage operations
export function getAdminStorage(bucketName: string) {
  const admin = createAdminClient()
  return admin.storage.from(bucketName)
}

export default createAdminClient
