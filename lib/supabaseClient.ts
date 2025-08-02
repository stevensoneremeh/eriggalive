import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Check if we're in preview mode or missing env vars
const isPreviewMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (isBrowser &&
    (window.location.hostname.includes("vusercontent.net") ||
      window.location.hostname.includes("v0.dev") ||
      window.location.hostname.includes("localhost")))

// Mock client for preview/development mode
const createMockClient = () => {
  const mockUser = {
    id: "mock-user-id",
    email: "demo@eriggalive.com",
    user_metadata: {
      username: "demo_user",
      full_name: "Demo User",
    },
    email_confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const mockSession = {
    access_token: "mock-token",
    refresh_token: "mock-refresh",
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
      signInWithPassword: ({ email, password }: { email: string; password: string }) => {
        // Simulate successful login for demo purposes
        return Promise.resolve({
          data: {
            user: { ...mockUser, email },
            session: { ...mockSession, user: { ...mockUser, email } },
          },
          error: null,
        })
      },
      signUp: ({ email, password, options }: any) => {
        return Promise.resolve({
          data: {
            user: {
              ...mockUser,
              email,
              user_metadata: options?.data || mockUser.user_metadata,
            },
            session: {
              ...mockSession,
              user: {
                ...mockUser,
                email,
                user_metadata: options?.data || mockUser.user_metadata,
              },
            },
          },
          error: null,
        })
      },
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: (email: string) => Promise.resolve({ error: null }),
      updateUser: (attributes: any) =>
        Promise.resolve({
          data: { user: { ...mockUser, ...attributes } },
          error: null,
        }),
      onAuthStateChange: (callback: any) => {
        // Simulate signed in state for demo
        setTimeout(() => {
          callback("SIGNED_IN", mockSession)
        }, 100)
        return {
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        }
      },
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
                  username: "demo_user",
                  full_name: "Demo User",
                  email: "demo@eriggalive.com",
                  tier: "grassroot",
                  coins: 500,
                  level: 1,
                  points: 100,
                  avatar_url: null,
                  is_verified: false,
                  is_active: true,
                  is_banned: false,
                  role: "user",
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
          limit: (limit: number) => {
            if (table === "community_posts") {
              return Promise.resolve({
                data: Array(Math.min(limit, 5))
                  .fill(0)
                  .map((_, i) => ({
                    id: i + 1,
                    content: `This is a demo post #${i + 1} for the Erigga Live community. Join the conversation and share your thoughts!`,
                    vote_count: Math.floor(Math.random() * 50) + 10,
                    comment_count: Math.floor(Math.random() * 15) + 2,
                    created_at: new Date(Date.now() - i * 3600000).toISOString(),
                    updated_at: new Date(Date.now() - i * 3600000).toISOString(),
                    user: {
                      id: 1,
                      username: `user_${i + 1}`,
                      full_name: `Community Member ${i + 1}`,
                      tier: ["grassroot", "pioneer", "elder"][i % 3],
                      avatar_url: null,
                    },
                    category: {
                      id: 1,
                      name: "General Discussion",
                      slug: "general",
                    },
                    user_has_voted: i % 3 === 0,
                  })),
                error: null,
              })
            }
            if (table === "community_categories") {
              return Promise.resolve({
                data: [
                  { id: 1, name: "General Discussion", slug: "general", is_active: true },
                  { id: 2, name: "Music & Lyrics", slug: "music", is_active: true },
                  { id: 3, name: "Events & Shows", slug: "events", is_active: true },
                  { id: 4, name: "Fan Art", slug: "fan-art", is_active: true },
                ],
                error: null,
              })
            }
            if (table === "vault") {
              return Promise.resolve({
                data: Array(Math.min(limit, 8))
                  .fill(0)
                  .map((_, i) => ({
                    id: i + 1,
                    title: `Exclusive Content ${i + 1}`,
                    description: `Premium content for Erigga fans - ${["Behind the scenes", "Unreleased track", "Live performance", "Studio session"][i % 4]}`,
                    type: ["audio", "video", "image", "document"][i % 4],
                    tier_required: ["grassroot", "pioneer", "elder", "blood"][i % 4],
                    coin_cost: [0, 50, 100, 200][i % 4],
                    file_url: `/placeholder.svg?height=200&width=300&text=Content+${i + 1}`,
                    thumbnail_url: `/placeholder.svg?height=150&width=200&text=Thumb+${i + 1}`,
                    is_premium: i % 2 === 1,
                    created_at: new Date(Date.now() - i * 86400000).toISOString(),
                  })),
                error: null,
              })
            }
            return Promise.resolve({ data: [], error: null })
          },
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
        or: (conditions: string) => ({
          limit: (limit: number) => Promise.resolve({ data: [], error: null }),
        }),
      }),
      insert: (data: any) => ({
        select: (columns?: string) => ({
          single: () =>
            Promise.resolve({
              data: {
                ...data,
                id: Math.floor(Math.random() * 1000) + 1,
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
            single: () =>
              Promise.resolve({
                data: { ...data, updated_at: new Date().toISOString() },
                error: null,
              }),
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
            data: { path: `demo/${path}` },
            error: null,
          }),
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `/placeholder.svg?height=200&width=200&text=Upload` },
        }),
      }),
    },
    rpc: (functionName: string, params: any) => {
      if (functionName === "handle_post_vote") {
        return Promise.resolve({ data: true, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    },
  } as any
}

// Create the actual Supabase client
function createSupabaseClient() {
  // If in preview mode or missing env vars, return mock client
  if (isPreviewMode) {
    console.log("🔧 Using mock Supabase client for demo/development")
    return createMockClient()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
}

// Export the client
export const supabase = createSupabaseClient()
export default supabase
