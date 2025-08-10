import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

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

// Create a mock server client for preview mode
const createMockServerClient = () => {
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
                  coins: 500,
                  level: 1,
                  points: 0,
                  reputation_score: 100,
                  avatar_url: null,
                  is_verified: false,
                  is_active: true,
                  is_banned: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              })
            }
            return Promise.resolve({ data: null, error: null })
          },
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
        order: (column: string, { ascending }: { ascending: boolean }) => ({
          limit: (limit: number) => {
            if (table === "community_posts") {
              return Promise.resolve({
                data: Array(Math.min(limit, 3))
                  .fill(0)
                  .map((_, i) => ({
                    id: i + 1,
                    content: `Mock post content ${i + 1}`,
                    vote_count: Math.floor(Math.random() * 50),
                    comment_count: Math.floor(Math.random() * 10),
                    created_at: new Date().toISOString(),
                    user: {
                      id: 1,
                      username: "mockuser",
                      full_name: "Mock User",
                      tier: "grassroot",
                      avatar_url: null,
                    },
                    category: {
                      id: 1,
                      name: "General",
                      slug: "general",
                    },
                    user_has_voted: false,
                  })),
                error: null,
              })
            }
            return Promise.resolve({ data: [], error: null })
          },
        }),
        limit: (limit: number) => Promise.resolve({ data: [], error: null }),
      }),
      insert: (data: any) => ({
        select: (columns?: string) => ({
          single: () =>
            Promise.resolve({
              data: {
                ...data,
                id: Math.floor(Math.random() * 1000),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            }),
        }),
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: (columns?: string) => ({
            single: () => Promise.resolve({ data: { ...data }, error: null }),
          }),
        }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => Promise.resolve({ error: null }),
      }),
    }),
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: { id: "mock-user-id", email: "mock@example.com" } },
          error: null,
        }),
      getSession: () =>
        Promise.resolve({
          data: { session: { user: { id: "mock-user-id", email: "mock@example.com" } } },
          error: null,
        }),
    },
    rpc: (functionName: string, params: any) => Promise.resolve({ data: true, error: null }),
    channel: (name: string) => ({
      on: (event: string, callback: any) => ({ subscribe: () => {} }),
      subscribe: () => Promise.resolve({ status: "SUBSCRIBED" }),
      unsubscribe: () => Promise.resolve({ status: "CLOSED" }),
    }),
    removeChannel: () => {},
  } as any
}

export async function createClient() {
  // If in preview mode, return a mock client
  if (isServerPreviewMode()) {
    return createMockServerClient()
  }

  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Missing Supabase environment variables for server client")
    return createMockServerClient()
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch (error) {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
          console.warn("Cookie setting failed in server component:", error)
        }
      },
    },
  })
}

// Alternative function for cases where cookies() might not be available
export function createClientComponentClient() {
  // This should only be used in client components
  if (typeof window === "undefined") {
    throw new Error("createClientComponentClient should only be used in client components")
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return document.cookie.split(";").map((cookie) => {
            const [name, value] = cookie.trim().split("=")
            return { name, value: decodeURIComponent(value || "") }
          })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookieString = `${name}=${encodeURIComponent(value)}`
            if (options?.maxAge) cookieString += `; max-age=${options.maxAge}`
            if (options?.path) cookieString += `; path=${options.path}`
            if (options?.domain) cookieString += `; domain=${options.domain}`
            if (options?.secure) cookieString += "; secure"
            if (options?.httpOnly) cookieString += "; httponly"
            if (options?.sameSite) cookieString += `; samesite=${options.sameSite}`
            document.cookie = cookieString
          })
        },
      },
    },
  )
}
