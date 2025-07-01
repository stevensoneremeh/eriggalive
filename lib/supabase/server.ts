import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

// Check if we're in preview mode
const isPreviewMode = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "preview"

// Mock server client for preview mode
const createMockServerClient = () => {
  const mockUser = {
    id: "mock-user-id",
    email: "mock@example.com",
    user_metadata: { username: "mockuser", full_name: "Mock User" },
    email_confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const mockSession = {
    access_token: "mock-token",
    refresh_token: "mock-refresh-token",
    expires_in: 3600,
    token_type: "bearer",
    user: mockUser,
  }

  return {
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: mockUser },
          error: null,
        }),
      getSession: () =>
        Promise.resolve({
          data: { session: mockSession },
          error: null,
        }),
    },
    from: (table: string) => ({
      select: (columns?: string) => ({
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
                  role: "user",
                  coins: 500,
                  level: 1,
                  points: 0,
                  avatar_url: null,
                  is_verified: false,
                  is_active: true,
                  is_banned: false,
                  login_count: 1,
                  email_verified: true,
                  phone_verified: false,
                  two_factor_enabled: false,
                  preferences: {},
                  metadata: {},
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
        order: (column: string, options?: { ascending: boolean }) => ({
          limit: (limit: number) => Promise.resolve({ data: [], error: null }),
          range: (start: number, end: number) => Promise.resolve({ data: [], error: null }),
        }),
        is: (column: string, value: any) => ({
          order: (column: string, options?: { ascending: boolean }) => ({
            limit: (limit: number) => Promise.resolve({ data: [], error: null }),
          }),
        }),
        ilike: (column: string, value: string) => ({
          limit: (limit: number) => Promise.resolve({ data: [], error: null }),
        }),
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
    storage: {
      from: (bucket: string) => ({
        upload: (path: string, file: File) =>
          Promise.resolve({
            data: { path: `mock/${path}` },
            error: null,
          }),
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `/placeholder.svg` },
        }),
      }),
    },
    rpc: (functionName: string, params: any) => {
      if (functionName === "handle_post_vote") {
        return Promise.resolve({ data: true, error: null })
      }
      return Promise.resolve({ data: true, error: null })
    },
    raw: (sql: string) => sql,
  } as any
}

export async function createClient() {
  if (isPreviewMode) {
    console.log("Using mock Supabase server client for preview mode")
    return createMockServerClient()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Missing Supabase environment variables, using mock server client")
    return createMockServerClient()
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
    console.error("Error creating Supabase server client:", error)
    return createMockServerClient()
  }
}

// Export a function to get a fresh client instance
export { createClient as default }
