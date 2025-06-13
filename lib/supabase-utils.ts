import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Function to check if we're in preview mode
export function isServerPreviewMode() {
  // In a real app, this would check for a specific environment variable or context
  // For now, we'll just check if we're running in development mode
  return process.env.NODE_ENV === "development"
}

// Create a Supabase client for server-side operations
export function createServerSupabaseClient() {
  // If in preview mode, return a mock client
  if (isServerPreviewMode()) {
    return createMockServerClient()
  }

  // Otherwise, create a real Supabase client
  const supabaseUrl = process.env.SUPABASE_URL || ""
  const supabaseKey = process.env.SUPABASE_ANON_KEY || ""

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
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
  const supabaseUrl = process.env.SUPABASE_URL || ""
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  })
}

// Get a server-side client
export function getServerClient() {
  return createServerSupabaseClient()
}

// Create a mock server client for preview mode
export function createMockServerClient() {
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
