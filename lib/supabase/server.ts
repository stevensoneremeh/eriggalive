// Re-export from our new utility file
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
  isServerPreviewMode as isPreviewMode,
  getServerClient,
} from "../supabase-utils"

export { createServerSupabaseClient, createAdminSupabaseClient, isPreviewMode, getServerClient }

// Helper to check if we're in a production environment
export const isProduction = () => {
  return process.env.NODE_ENV === "production"
}

// Helper to check if we're in a development environment
export const isDevelopment = () => {
  return process.env.NODE_ENV === "development"
}

// Create a server-side Supabase client
// export const createServerSupabaseClient = () => {
//   if (isPreviewMode()) {
//     return createMockServerClient()
//   }

//   const supabaseUrl = process.env.SUPABASE_URL
//   const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

//   if (!supabaseUrl || !supabaseServiceKey) {
//     console.error("Missing Supabase environment variables for server client")
//     return createMockServerClient()
//   }

//   return createClient(supabaseUrl, supabaseServiceKey, {
//     auth: {
//       autoRefreshToken: false,
//       persistSession: false,
//     },
//   })
// }

// // Create an admin Supabase client with service role key
// export const createAdminSupabaseClient = () => {
//   if (isPreviewMode()) {
//     return createMockServerClient()
//   }

//   const supabaseUrl = process.env.SUPABASE_URL
//   const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

//   if (!supabaseUrl || !supabaseServiceKey) {
//     console.error("Missing Supabase environment variables for admin client")
//     return createMockServerClient()
//   }

//   return createClient(supabaseUrl, supabaseServiceKey, {
//     auth: {
//       autoRefreshToken: false,
//       persistSession: false,
//     },
//   })
// }

// Create a mock server client for preview mode
export const createMockServerClient = () => {
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

// Create a server-side client that works in both preview and production
// export const getServerClient = async () => {
//   return createServerSupabaseClient()
// }
