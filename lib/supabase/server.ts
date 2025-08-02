import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { cookies } from "next/headers"

/* -------------------------------------------------------------------------- */
/*                              ENV & UTIL HELPERS                            */
/* -------------------------------------------------------------------------- */

export const isProduction = () => process.env.NODE_ENV === "production"
export const isDevelopment = () => process.env.NODE_ENV === "development"

/**
 * Return TRUE when we are building locally / in preview and do **not** have a
 * real Supabase URL or key.  In this mode we serve mock data so the build
 * never contacts Supabase (useful for Vercel previews & storybook).
 */
export const isPreviewMode = () =>
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"

/* -------------------------------------------------------------------------- */
/*                                    MOCK                                    */
/* -------------------------------------------------------------------------- */

/**
 * A comprehensive mock client that provides demo data for all major features
 */
export function createMockServerClient(): SupabaseClient<Database> {
  const mockData = {
    users: [
      {
        id: 1,
        auth_user_id: "mock-user-1",
        username: "demo_user",
        full_name: "Demo User",
        email: "demo@eriggalive.com",
        tier: "grassroot" as const,
        coins: 500,
        level: 1,
        points: 100,
        avatar_url: null,
        is_verified: false,
        is_active: true,
        is_banned: false,
        role: "user" as const,
        login_count: 1,
        email_verified: true,
        phone_verified: false,
        two_factor_enabled: false,
        preferences: {},
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    community_posts: Array(10)
      .fill(0)
      .map((_, i) => ({
        id: i + 1,
        content: `Demo post ${i + 1} - This is sample content for the Erigga Live community platform.`,
        vote_count: Math.floor(Math.random() * 50) + 5,
        comment_count: Math.floor(Math.random() * 20) + 1,
        created_at: new Date(Date.now() - i * 3600000).toISOString(),
        updated_at: new Date(Date.now() - i * 3600000).toISOString(),
        user: {
          id: 1,
          username: `user_${i + 1}`,
          full_name: `Community Member ${i + 1}`,
          tier: ["grassroot", "pioneer", "elder", "blood"][i % 4],
          avatar_url: null,
        },
        category: {
          id: 1,
          name: "General Discussion",
          slug: "general",
        },
        user_has_voted: i % 3 === 0,
      })),
    community_categories: [
      { id: 1, name: "General Discussion", slug: "general", is_active: true },
      { id: 2, name: "Music & Lyrics", slug: "music", is_active: true },
      { id: 3, name: "Events & Shows", slug: "events", is_active: true },
      { id: 4, name: "Fan Art", slug: "fan-art", is_active: true },
    ],
    vault: Array(12)
      .fill(0)
      .map((_, i) => ({
        id: i + 1,
        title: `Exclusive Content ${i + 1}`,
        description: `Premium content for Erigga fans - ${["Behind the scenes footage", "Unreleased track preview", "Live performance recording", "Studio session clips"][i % 4]}`,
        type: ["audio", "video", "image", "document"][i % 4] as const,
        tier_required: ["grassroot", "pioneer", "elder", "blood"][i % 4] as const,
        coin_cost: [0, 50, 100, 200][i % 4],
        file_url: `/placeholder.svg?height=400&width=600&text=Content+${i + 1}`,
        thumbnail_url: `/placeholder.svg?height=200&width=300&text=Thumbnail+${i + 1}`,
        is_premium: i % 2 === 1,
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
      })),
  }

  // @ts-expect-error – we are faking the minimal API surface
  return {
    from: (table: string) => ({
      select: (columns?: string) => {
        const data = mockData[table as keyof typeof mockData] || []
        return Promise.resolve({ data, error: null })
      },
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
      upsert: (data: any) => Promise.resolve({ data: [data], error: null }),
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
        eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
      }),
      eq: function (column: string, value: any) {
        return this
      },
      single: () => Promise.resolve({ data: mockData.users[0] || null, error: null }),
      order: function (column: string, options?: { ascending: boolean }) {
        return this
      },
      limit: function (limit: number) {
        return this
      },
      range: function (start: number, end: number) {
        return this
      },
    }),
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: "mock-user-1",
            email: "demo@eriggalive.com",
            user_metadata: { username: "demo_user", full_name: "Demo User" },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
        error: null,
      }),
      getSession: async () => ({
        data: {
          session: {
            user: {
              id: "mock-user-1",
              email: "demo@eriggalive.com",
              user_metadata: { username: "demo_user", full_name: "Demo User" },
            },
            access_token: "mock-token",
          },
        },
        error: null,
      }),
    },
    rpc: (functionName: string, params: any) => {
      if (functionName === "handle_post_vote") {
        return Promise.resolve({ data: true, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    },
    storage: {
      from: (bucket: string) => ({
        upload: (path: string, file: any) =>
          Promise.resolve({
            data: { path: `demo/${path}` },
            error: null,
          }),
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `/placeholder.svg?height=200&width=200&text=Demo` },
        }),
      }),
    },
  }
}

/* -------------------------------------------------------------------------- */
/*                             REAL SUPABASE CLIENTS                          */
/* -------------------------------------------------------------------------- */

/**
 * Standard server-side client built with the ANON key.
 * Uses cookies for auth state management.
 */
export function createServerSupabaseClient() {
  if (isPreviewMode()) {
    console.log("🔧 Using mock server Supabase client")
    return createMockServerClient()
  }

  try {
    const cookieStore = cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    return createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          Cookie: cookieStore.toString(),
        },
      },
    })
  } catch (error) {
    console.warn("Failed to create real Supabase client, falling back to mock:", error)
    return createMockServerClient()
  }
}

/**
 * Server-side client that can access cookies for auth state
 */
export function createServerSupabaseClientWithAuth(): SupabaseClient<Database> {
  if (isPreviewMode()) {
    return createMockServerClient()
  }

  try {
    const cookieStore = cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    return createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          Cookie: cookieStore.toString(),
        },
      },
    })
  } catch (error) {
    console.warn("Failed to create authenticated Supabase client, falling back to mock:", error)
    return createMockServerClient()
  }
}

/**
 * Elevated-privilege client that uses the SERVICE_ROLE key.
 * NEVER expose this to the browser!
 */
export function createAdminSupabaseClient(): SupabaseClient<Database> {
  if (isPreviewMode()) {
    return createMockServerClient()
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    return createSupabaseClient<Database>(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    })
  } catch (error) {
    console.warn("Failed to create admin Supabase client, falling back to mock:", error)
    return createMockServerClient()
  }
}

/* -------------------------------------------------------------------------- */
/*                         BACKWARDS-COMPATIBILITY EXPORTS                    */
/* -------------------------------------------------------------------------- */

/**
 * Some modules import `createClient` instead of `createServerSupabaseClient`.
 * Exporting an alias keeps them working without edits.
 */
export const createClient = createServerSupabaseClient

/**
 * Older code imported `getServerClient`.  Provide the same implementation.
 */
export const getServerClient = createServerSupabaseClient
