import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

export async function createClient() {
  const cookieStore = cookies()

  // Check if we're in a server preview environment
  const isServerPreviewMode = () => {
    const hostname = process.env.VERCEL_URL || ""
    return (
      hostname.includes("preview") ||
      hostname.includes("localhost") ||
      hostname.includes("127.0.0.1") ||
      process.env.NODE_ENV !== "production" ||
      hostname.includes("vusercontent.net") ||
      hostname.includes("v0.dev")
    )
  }

  // If in preview mode, return a mock client
  if (isServerPreviewMode()) {
    return createMockServerClient()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables")
    return createMockServerClient()
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        try {
          cookieStore.set(name, value, options)
        } catch (error) {
          // This can happen when cookies are manipulated by middleware or server actions
        }
      },
      remove(name, options) {
        try {
          cookieStore.set(name, "", { ...options, maxAge: 0 })
        } catch (error) {
          // This can happen when cookies are manipulated by middleware or server actions
        }
      },
    },
  })
}

// Create a mock server client for preview mode
function createMockServerClient() {
  return {
    from: (table: string) => ({
      select: (query?: string) => ({
        eq: (column: string, value: any) => ({
          single: () => {
            if (table === "users" && column === "auth_user_id") {
              return Promise.resolve({
                data: {
                  id: 1,
                  auth_user_id: value,
                  username: "mockuser",
                  full_name: "Mock User",
                  email: "mock@example.com",
                  tier: "grassroot",
                  coins_balance: 500,
                  avatar_url: null,
                },
                error: null,
              })
            }
            return Promise.resolve({ data: null, error: null })
          },
        }),
        limit: (limit: number) => {
          if (table === "community_posts") {
            return Promise.resolve({
              data: Array(limit)
                .fill(0)
                .map((_, i) => ({
                  id: i + 1,
                  title: `Mock Post ${i + 1}`,
                  content: "This is a mock post content",
                  user_id: "mock-user-id",
                  created_at: new Date().toISOString(),
                  category_id: 1,
                  upvotes: 5,
                  downvotes: 1,
                })),
              error: null,
            })
          }
          if (table === "community_categories") {
            return Promise.resolve({
              data: [
                { id: 1, name: "General", description: "General discussions" },
                { id: 2, name: "Music", description: "Music discussions" },
              ],
              error: null,
            })
          }
          return Promise.resolve({ data: [], error: null })
        },
      }),
      insert: (data: any) => Promise.resolve({ data: { ...data, id: Math.floor(Math.random() * 1000) }, error: null }),
      update: (data: any) => Promise.resolve({ data, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
      getUser: () =>
        Promise.resolve({ data: { user: { id: "mock-user-id", email: "mock@example.com" } }, error: null }),
      getSession: () =>
        Promise.resolve({
          data: { session: { user: { id: "mock-user-id", email: "mock@example.com" } } },
          error: null,
        }),
    },
  } as any
}

export async function createServerSupabaseClient() {
  return createClient()
}

export async function createAdminSupabaseClient() {
  // Check if we're in a server preview environment
  const isServerPreviewMode = () => {
    const hostname = process.env.VERCEL_URL || ""
    return (
      hostname.includes("preview") ||
      hostname.includes("localhost") ||
      hostname.includes("127.0.0.1") ||
      process.env.NODE_ENV !== "production" ||
      hostname.includes("vusercontent.net") ||
      hostname.includes("v0.dev")
    )
  }

  // If in preview mode, return a mock client
  if (isServerPreviewMode()) {
    return createMockServerClient()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase admin environment variables")
    return createMockServerClient()
  }

  return createServerClient<Database>(supabaseUrl, supabaseServiceKey, {
    cookies: {
      get() {
        return undefined
      },
      set() {
        // Admin client doesn't need cookies
      },
      remove() {
        // Admin client doesn't need cookies
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
