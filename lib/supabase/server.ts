import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

export async function createClient() {
  const cookieStore = cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Check if we're in a server preview environment
  const isServerPreviewMode = () => {
    const hostname = process.env.VERCEL_URL || ""
    return (
      hostname.includes("preview") ||
      hostname.includes("localhost") ||
      hostname.includes("127.0.0.1") ||
      process.env.NODE_ENV !== "production" ||
      hostname.includes("vusercontent.net") ||
      hostname.includes("v0.dev") ||
      !supabaseUrl ||
      !supabaseAnonKey
    )
  }

  // If in preview mode or missing env vars, return a mock client
  if (isServerPreviewMode()) {
    console.warn("Using mock server Supabase client")
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

// Create a comprehensive mock server client for preview mode
function createMockServerClient() {
  const mockUser = {
    id: "mock-user-id",
    email: "mock@example.com",
    user_metadata: {
      username: "mockuser",
      full_name: "Mock User",
    },
  }

  return {
    from: (table: string) => {
      console.log("Mock server from called with table:", table)

      const createMockQuery = (data: any[] = []) => ({
        select: (query?: string) => {
          console.log("Mock server select called with query:", query)
          return {
            eq: (column: string, value: any) => {
              console.log("Mock server eq called with:", { column, value })
              return {
                single: () => {
                  console.log("Mock server single called")
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
                  console.log("Mock server second eq called with:", { column2, value2 })
                  return {
                    single: () => Promise.resolve({ data: data[0] || null, error: null }),
                    order: (orderColumn: string, options: any) => ({
                      limit: (limit: number) => Promise.resolve({ data: data.slice(0, limit), error: null }),
                    }),
                  }
                },
                order: (orderColumn: string, options: any) => {
                  console.log("Mock server order called with:", { orderColumn, options })
                  return {
                    limit: (limit: number) => {
                      console.log("Mock server limit called with:", limit)
                      return Promise.resolve({ data: data.slice(0, limit), error: null })
                    },
                  }
                },
              }
            },
            order: (orderColumn: string, options: any) => {
              console.log("Mock server order called with:", { orderColumn, options })
              return {
                limit: (limit: number) => {
                  console.log("Mock server limit called with:", limit)
                  return Promise.resolve({ data: data.slice(0, limit), error: null })
                },
              }
            },
            limit: (limit: number) => {
              console.log("Mock server limit called with:", limit)
              if (table === "community_categories") {
                const mockCategories = [
                  { id: 1, name: "General", description: "General discussions", is_active: true },
                  { id: 2, name: "Music", description: "Music discussions", is_active: true },
                  { id: 3, name: "Events", description: "Event discussions", is_active: true },
                ]
                return Promise.resolve({ data: mockCategories, error: null })
              }
              return Promise.resolve({ data: data.slice(0, limit), error: null })
            },
          }
        },
        insert: (insertData: any) => {
          console.log("Mock server insert called with:", insertData)
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
          console.log("Mock server update called with:", updateData)
          return {
            eq: (column: string, value: any) => ({
              select: (columns?: string) => ({
                single: () => Promise.resolve({ data: { ...updateData, id: value }, error: null }),
              }),
            }),
          }
        },
        delete: () => {
          console.log("Mock server delete called")
          return {
            eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
          }
        },
      })

      return createMockQuery([])
    },
    auth: {
      getUser: () => {
        console.log("Mock server getUser called")
        return Promise.resolve({
          data: { user: mockUser },
          error: null,
        })
      },
      getSession: () => {
        console.log("Mock server getSession called")
        return Promise.resolve({
          data: {
            session: {
              user: mockUser,
              access_token: "mock-token",
            },
          },
          error: null,
        })
      },
    },
    storage: {
      from: (bucket: string) => ({
        upload: (path: string, file: File) => {
          console.log("Mock server storage upload called with:", { bucket, path, file: file.name })
          return Promise.resolve({
            data: { path: `mock/${path}` },
            error: null,
          })
        },
        getPublicUrl: (path: string) => {
          console.log("Mock server getPublicUrl called with:", path)
          return {
            data: { publicUrl: `/placeholder.jpg` },
          }
        },
        remove: (paths: string[]) => {
          console.log("Mock server storage remove called with:", paths)
          return Promise.resolve({ data: null, error: null })
        },
      }),
    },
    rpc: (functionName: string, params?: any) => {
      console.log("Mock server RPC called with:", { functionName, params })
      return Promise.resolve({ data: true, error: null })
    },
  } as any
}

export async function createServerSupabaseClient() {
  return createClient()
}

export async function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Check if we're in a server preview environment
  const isServerPreviewMode = () => {
    const hostname = process.env.VERCEL_URL || ""
    return (
      hostname.includes("preview") ||
      hostname.includes("localhost") ||
      hostname.includes("127.0.0.1") ||
      process.env.NODE_ENV !== "production" ||
      hostname.includes("vusercontent.net") ||
      hostname.includes("v0.dev") ||
      !supabaseUrl ||
      !supabaseServiceKey
    )
  }

  // If in preview mode or missing env vars, return a mock client
  if (isServerPreviewMode()) {
    console.warn("Using mock admin Supabase client")
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
