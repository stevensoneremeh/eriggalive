import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  // Return existing client if it exists (singleton pattern)
  if (supabaseClient) {
    return supabaseClient
  }

  // Check if we're in a browser environment
  const isBrowser = typeof window !== "undefined"

  // Check if we're in preview mode
  const isPreviewMode =
    isBrowser && (window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("v0.dev"))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If in preview mode or missing env vars, return a mock client
  if (isPreviewMode || !supabaseUrl || !supabaseAnonKey) {
    console.warn("Using mock Supabase client")
    return createMockClient()
  }

  supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  })

  return supabaseClient
}

// Create a comprehensive mock client for preview mode
function createMockClient() {
  const mockUser = {
    id: "mock-user-id",
    email: "mock@example.com",
    user_metadata: {
      username: "mockuser",
      full_name: "Mock User",
    },
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
      getSession: () =>
        Promise.resolve({
          data: { session: mockSession },
          error: null,
        }),
      getUser: () =>
        Promise.resolve({
          data: { user: mockUser },
          error: null,
        }),
      signUp: ({ email, password, options }: any) => {
        console.log("Mock signUp called with:", { email, options })
        return Promise.resolve({
          data: {
            user: {
              ...mockUser,
              email,
              user_metadata: options?.data || {},
            },
            session: mockSession,
          },
          error: null,
        })
      },
      signInWithPassword: ({ email, password }: any) => {
        console.log("Mock signInWithPassword called with:", { email })
        return Promise.resolve({
          data: {
            user: { ...mockUser, email },
            session: mockSession,
          },
          error: null,
        })
      },
      signOut: () => {
        console.log("Mock signOut called")
        return Promise.resolve({ error: null })
      },
      resetPasswordForEmail: (email: string, options?: any) => {
        console.log("Mock resetPasswordForEmail called with:", { email, options })
        return Promise.resolve({ error: null })
      },
      onAuthStateChange: (callback: any) => {
        console.log("Mock onAuthStateChange called")
        // Simulate initial state
        setTimeout(() => {
          callback("SIGNED_IN", { user: mockUser, session: mockSession })
        }, 100)
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                console.log("Mock auth subscription unsubscribed")
              },
            },
          },
        }
      },
    },
    from: (table: string) => {
      console.log("Mock from called with table:", table)

      const createMockQuery = (data: any[] = []) => ({
        select: (columns?: string) => {
          console.log("Mock select called with columns:", columns)
          return {
            eq: (column: string, value: any) => {
              console.log("Mock eq called with:", { column, value })
              return {
                single: () => {
                  console.log("Mock single called")
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
                        level: 1,
                        points: 100,
                        reputation_score: 50,
                        role: "user",
                        is_active: true,
                        is_verified: false,
                        is_banned: false,
                        last_seen: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      },
                      error: null,
                    })
                  }
                  return Promise.resolve({ data: data[0] || null, error: null })
                },
                eq: (column2: string, value2: any) => {
                  console.log("Mock second eq called with:", { column2, value2 })
                  return {
                    single: () => Promise.resolve({ data: data[0] || null, error: null }),
                    order: (orderColumn: string, options: any) => ({
                      limit: (limit: number) => Promise.resolve({ data: data.slice(0, limit), error: null }),
                    }),
                  }
                },
                order: (orderColumn: string, options: any) => {
                  console.log("Mock order called with:", { orderColumn, options })
                  return {
                    limit: (limit: number) => {
                      console.log("Mock limit called with:", limit)
                      return Promise.resolve({ data: data.slice(0, limit), error: null })
                    },
                  }
                },
              }
            },
            order: (orderColumn: string, options: any) => {
              console.log("Mock order called with:", { orderColumn, options })
              return {
                limit: (limit: number) => {
                  console.log("Mock limit called with:", limit)
                  if (table === "community_posts") {
                    const mockPosts = Array(Math.min(limit, 5))
                      .fill(0)
                      .map((_, i) => ({
                        id: i + 1,
                        title: `Mock Post ${i + 1}`,
                        content: `This is mock post content ${i + 1}. Welcome to the community!`,
                        user_id: 1,
                        category_id: 1,
                        vote_count: Math.floor(Math.random() * 20),
                        comment_count: Math.floor(Math.random() * 10),
                        is_published: true,
                        is_deleted: false,
                        created_at: new Date(Date.now() - i * 3600000).toISOString(),
                        updated_at: new Date(Date.now() - i * 3600000).toISOString(),
                        user: {
                          id: 1,
                          auth_user_id: "mock-user-id",
                          username: "mockuser",
                          full_name: "Mock User",
                          avatar_url: null,
                          tier: "grassroot",
                        },
                      }))
                    return Promise.resolve({ data: mockPosts, error: null })
                  }
                  return Promise.resolve({ data: data.slice(0, limit), error: null })
                },
              }
            },
            limit: (limit: number) => {
              console.log("Mock limit called with:", limit)
              return Promise.resolve({ data: data.slice(0, limit), error: null })
            },
          }
        },
        insert: (insertData: any) => {
          console.log("Mock insert called with:", insertData)
          const newData = Array.isArray(insertData) ? insertData : [insertData]
          return {
            select: (columns?: string) => {
              return {
                single: () =>
                  Promise.resolve({
                    data: { ...newData[0], id: Math.floor(Math.random() * 1000) },
                    error: null,
                  }),
              }
            },
          }
        },
        update: (updateData: any) => {
          console.log("Mock update called with:", updateData)
          return {
            eq: (column: string, value: any) => ({
              select: (columns?: string) => ({
                single: () => Promise.resolve({ data: { ...updateData, id: value }, error: null }),
              }),
            }),
          }
        },
        delete: () => {
          console.log("Mock delete called")
          return {
            eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
          }
        },
      })

      // Return different mock data based on table
      if (table === "community_categories") {
        return createMockQuery([
          { id: 1, name: "General", description: "General discussions", is_active: true },
          { id: 2, name: "Music", description: "Music discussions", is_active: true },
          { id: 3, name: "Events", description: "Event discussions", is_active: true },
        ])
      }

      return createMockQuery([])
    },
    storage: {
      from: (bucket: string) => ({
        upload: (path: string, file: File) => {
          console.log("Mock storage upload called with:", { bucket, path, file: file.name })
          return Promise.resolve({
            data: { path: `mock/${path}` },
            error: null,
          })
        },
        getPublicUrl: (path: string) => {
          console.log("Mock getPublicUrl called with:", path)
          return {
            data: { publicUrl: `/placeholder.jpg` },
          }
        },
      }),
    },
    rpc: (functionName: string, params?: any) => {
      console.log("Mock RPC called with:", { functionName, params })
      return Promise.resolve({ data: true, error: null })
    },
  } as any
}

// Legacy alias for backward compatibility
export const createClientSupabase = createClient

// Default export
export default createClient
