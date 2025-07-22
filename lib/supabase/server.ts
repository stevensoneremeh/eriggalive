import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

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
}

// Create a mock server client for preview mode
const createMockServerClient = () => {
  return {
    from: (table: string) => ({
      select: (query?: string) => ({
        eq: (column: string, value: any) => ({
          single: () => {
            if (table === "user_profiles" && column === "user_id") {
              return Promise.resolve({
                data: {
                  id: 1,
                  user_id: value,
                  username: "mockuser",
                  tier: "grassroot",
                  coins: 500,
                },
                error: null,
              })
            }
            return Promise.resolve({ data: null, error: null })
          },
          order: (column: string, { ascending }: { ascending: boolean }) => ({
            limit: (limit: number) => {
              if (table === "media_items") {
                return Promise.resolve({
                  data: Array(limit)
                    .fill(0)
                    .map((_, i) => ({
                      id: i + 1,
                      title: `Mock Media ${i + 1}`,
                      description: "Mock description",
                      url: "/placeholder.jpg",
                      thumbnail_url: "/placeholder.jpg",
                      media_type: "image",
                      created_at: new Date().toISOString(),
                      tier_access: "grassroot",
                    })),
                  error: null,
                })
              }
              return Promise.resolve({ data: [], error: null })
            },
          }),
        }),
        order: (column: string, { ascending }: { ascending: boolean }) => ({
          limit: (limit: number) => {
            if (table === "media_items") {
              return Promise.resolve({
                data: Array(limit)
                  .fill(0)
                  .map((_, i) => ({
                    id: i + 1,
                    title: `Mock Media ${i + 1}`,
                    description: "Mock description",
                    url: "/placeholder.jpg",
                    thumbnail_url: "/placeholder.jpg",
                    media_type: "image",
                    created_at: new Date().toISOString(),
                    tier_access: "grassroot",
                  })),
                error: null,
              })
            }
            return Promise.resolve({ data: [], error: null })
          },
        }),
        limit: (limit: number) => {
          if (table === "media_items") {
            return Promise.resolve({
              data: Array(limit)
                .fill(0)
                .map((_, i) => ({
                  id: i + 1,
                  title: `Mock Media ${i + 1}`,
                  description: "Mock description",
                  url: "/placeholder.jpg",
                  thumbnail_url: "/placeholder.jpg",
                  media_type: "image",
                  created_at: new Date().toISOString(),
                  tier_access: "grassroot",
                })),
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

// Helper to check if we're in a server preview environment
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

// Create a server-side Supabase client
export function createServerSupabaseClient() {
  // If in preview mode, return a mock client
  if (isServerPreviewMode()) {
    return createMockServerClient()
  }

  // Otherwise, create a real Supabase client
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables for server client")
    return createMockServerClient()
  }

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Create an admin Supabase client with service role key
export function createAdminSupabaseClient() {
  // If in preview mode, return a mock client
  if (isServerPreviewMode()) {
    return createMockServerClient()
  }

  // Otherwise, create a real Supabase client with admin privileges
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables for admin client")
    return createMockServerClient()
  }

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
