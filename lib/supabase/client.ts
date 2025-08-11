import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

// Check if we're in preview mode (v0.dev or similar)
const isPreviewMode =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("v0.dev"))

// Mock client for preview mode
const createMockClient = () => {
  return {
    auth: {
      getSession: () =>
        Promise.resolve({
          data: {
            session: {
              user: {
                id: "mock-user-id",
                email: "mock@example.com",
                user_metadata: { username: "mockuser", full_name: "Mock User" },
              },
              access_token: "mock-token",
              refresh_token: "mock-refresh-token",
              expires_at: Date.now() + 3600000,
              token_type: "bearer",
            },
          },
          error: null,
        }),
      getUser: () =>
        Promise.resolve({
          data: {
            user: {
              id: "mock-user-id",
              email: "mock@example.com",
              user_metadata: { username: "mockuser", full_name: "Mock User" },
              aud: "authenticated",
              role: "authenticated",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
          error: null,
        }),
      signInWithPassword: ({ email, password }: { email: string; password: string }) =>
        Promise.resolve({
          data: {
            user: {
              id: "mock-user-id",
              email: email,
              user_metadata: { username: "mockuser", full_name: "Mock User" },
              aud: "authenticated",
              role: "authenticated",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            session: {
              access_token: "mock-token",
              refresh_token: "mock-refresh-token",
              expires_at: Date.now() + 3600000,
              token_type: "bearer",
              user: {
                id: "mock-user-id",
                email: email,
              },
            },
          },
          error: null,
        }),
      signUp: ({ email, password, options }: { email: string; password: string; options?: any }) =>
        Promise.resolve({
          data: {
            user: {
              id: "mock-user-id",
              email: email,
              user_metadata: { username: "mockuser", full_name: "Mock User" },
              aud: "authenticated",
              role: "authenticated",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            session: {
              access_token: "mock-token",
              refresh_token: "mock-refresh-token",
              expires_at: Date.now() + 3600000,
              token_type: "bearer",
              user: {
                id: "mock-user-id",
                email: email,
              },
            },
          },
          error: null,
        }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: null }),
      updateUser: () =>
        Promise.resolve({
          data: { user: null },
          error: null,
        }),
      onAuthStateChange: (callback: any) => {
        setTimeout(() => {
          callback("SIGNED_IN", {
            access_token: "mock-token",
            refresh_token: "mock-refresh-token",
            expires_at: Date.now() + 3600000,
            token_type: "bearer",
            user: {
              id: "mock-user-id",
              email: "mock@example.com",
              user_metadata: { username: "mockuser", full_name: "Mock User" },
            },
          })
        }, 100)
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
    },
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          eq: (column2: string, value2: any) => ({
            order: (orderColumn: string, options?: { ascending: boolean }) => ({
              limit: (limit: number) => {
                if (table === "community_posts") {
                  return Promise.resolve({
                    data: [
                      {
                        id: 1,
                        title: "Welcome to the Community!",
                        content: "This is a mock post for preview mode.",
                        user_id: "mock-user-id",
                        category_id: 1,
                        is_published: true,
                        is_deleted: false,
                        vote_count: 5,
                        comment_count: 2,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        user: {
                          username: "mockuser",
                          full_name: "Mock User",
                          avatar_url: null,
                          tier: "grassroot",
                        },
                      },
                    ],
                    error: null,
                  })
                }
                return Promise.resolve({ data: [], error: null })
              },
            }),
          }),
          single: () => {
            if (table === "users" && column === "auth_user_id") {
              return Promise.resolve({
                data: {
                  id: "mock-user-id",
                  auth_user_id: value,
                  username: "mockuser",
                  full_name: "Mock User",
                  email: "mock@example.com",
                  tier: "grassroot",
                  coins: 500,
                  level: 1,
                  points: 0,
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
        match: (conditions: Record<string, any>) => ({
          order: (orderColumn: string, options?: { ascending: boolean }) => ({
            limit: (limit: number) => {
              if (table === "community_posts") {
                return Promise.resolve({
                  data: [
                    {
                      id: 1,
                      title: "Welcome to the Community!",
                      content:
                        "This is a mock post for preview mode. You can create posts, interact with other users, and explore all the community features.",
                      user_id: "mock-user-id",
                      category_id: 1,
                      is_published: true,
                      is_deleted: false,
                      vote_count: 5,
                      comment_count: 2,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      user: {
                        username: "mockuser",
                        full_name: "Mock User",
                        avatar_url: null,
                        tier: "grassroot",
                      },
                    },
                    {
                      id: 2,
                      title: "Preview Mode Active",
                      content:
                        "This is another mock post to show how the community feed works. In the real app, these would be actual user posts from the database.",
                      user_id: "mock-user-id-2",
                      category_id: 2,
                      is_published: true,
                      is_deleted: false,
                      vote_count: 12,
                      comment_count: 8,
                      created_at: new Date(Date.now() - 86400000).toISOString(),
                      updated_at: new Date(Date.now() - 86400000).toISOString(),
                      user: {
                        username: "previewuser",
                        full_name: "Preview User",
                        avatar_url: null,
                        tier: "pioneer",
                      },
                    },
                  ],
                  error: null,
                })
              }
              return Promise.resolve({ data: [], error: null })
            },
          }),
        }),
        order: (column: string, options?: { ascending: boolean }) => ({
          limit: (limit: number) => Promise.resolve({ data: [], error: null }),
          range: (start: number, end: number) => Promise.resolve({ data: [], error: null }),
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
  } as any
}

let clientInstance: ReturnType<typeof createBrowserClient<Database>> | any | undefined

export function createClient() {
  // Return mock client in preview mode
  if (isPreviewMode) {
    if (!clientInstance) {
      clientInstance = createMockClient()
    }
    return clientInstance
  }

  // Return existing client if it exists (singleton pattern)
  if (clientInstance) {
    return clientInstance
  }

  // Check if Supabase is configured
  if (!isSupabaseConfigured) {
    console.warn("Supabase environment variables are not set. Using mock client.")
    clientInstance = createMockClient()
    return clientInstance
  }

  try {
    clientInstance = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    return clientInstance
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    clientInstance = createMockClient()
    return clientInstance
  }
}

export const supabase = createClient()
