import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables")
    // Return mock client to prevent crashes
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: { message: "Supabase not configured" } }),
        getSession: () => Promise.resolve({ data: { session: null }, error: { message: "Supabase not configured" } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } }),
            }),
          }),
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } }),
          }),
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
          }),
        }),
      }),
    } as any
  }

  try {
    const cookieStore = await cookies()

    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    })
  } catch (error) {
    console.error("Failed to create server Supabase client:", error)
    // Return mock client as fallback
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: { message: "Server client creation failed" } }),
        getSession: () =>
          Promise.resolve({ data: { session: null }, error: { message: "Server client creation failed" } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: "Server client creation failed" } }),
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: { message: "Server client creation failed" } }),
            }),
          }),
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: { message: "Server client creation failed" } }),
          }),
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: "Server client creation failed" } }),
          }),
        }),
      }),
    } as any
  }
}

export async function createServerSupabaseClient() {
  return createClient()
}

export async function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase admin environment variables")
    return createClient() // Fallback to regular client
  }

  try {
    return createServerClient<Database>(supabaseUrl, supabaseServiceKey, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // Admin client doesn't need cookies
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  } catch (error) {
    console.error("Failed to create admin Supabase client:", error)
    return createClient() // Fallback to regular client
  }
}
