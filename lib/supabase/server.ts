import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

export async function createClient() {
  const cookieStore = await cookies()

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[SERVER] Missing Supabase environment variables")
    // Return a mock client that prevents crashes
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        signUp: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        resetPasswordForEmail: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
        updateUser: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
            single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
            order: () => ({
              eq: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } }),
            }),
          }),
          order: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } }),
        }),
        insert: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        update: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        }),
        delete: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        }),
      }),
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
          download: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
          list: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } }),
          remove: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        }),
        listBuckets: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } }),
        createBucket: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      },
      // Add real-time functionality for mock server client  
      channel: (name: string) => ({
        on: (event: string, config: any, callback: any) => ({
          subscribe: () => ({ 
            unsubscribe: () => {} 
          }),
        }),
      }),
      removeChannel: () => {},
    } as any
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch (error: any) {
          console.warn("[SERVER] Cookie setting failed in server component:", error.message)
        }
      },
    },
  })
}

export async function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[SERVER] Missing Supabase admin environment variables")
    throw new Error("Missing Supabase admin environment variables")
  }

  return createServerClient<Database>(supabaseUrl, supabaseServiceKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {
        // Admin client doesn't need cookies
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function createRouteHandlerClient({ cookies: cookiesFn }: { cookies: () => any }) {
  console.warn("createRouteHandlerClient is deprecated. Use createClient() from @/lib/supabase/server instead.")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  const cookieStore = cookiesFn()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch (error: any) {
          console.warn("[SERVER] Cookie setting failed:", error.message)
        }
      },
    },
  })
}

// Alternative function for cases where cookies() might not be available
export function createClientComponentClient() {
  console.warn(
    "createClientComponentClient should not be used on server. Use createClient() from @/lib/supabase/client for client-side.",
  )

  // This should only be used in client components
  if (typeof window === "undefined") {
    throw new Error("createClientComponentClient should only be used in client components")
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
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
  })
}

export const createServerSupabaseClient = createClient
export const createAdminSupabaseClient = createAdminClient

export { createClient as createServerClient }
