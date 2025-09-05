import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

const serverClientCache = new Map<string, ReturnType<typeof createServerClient<Database>>>()

export async function createClient() {
  const cookieStore = await cookies()

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[SERVER] Missing Supabase environment variables")
    throw new Error("Missing Supabase environment variables")
  }

  const cacheKey = `${supabaseUrl}-${supabaseAnonKey}-server`

  if (serverClientCache.has(cacheKey)) {
    return serverClientCache.get(cacheKey)!
  }

  const client = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
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
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "X-Client-Info": "eriggalive-server",
        "X-Client-Version": "1.0.0",
      },
    },
  })

  serverClientCache.set(cacheKey, client)

  setTimeout(() => {
    serverClientCache.delete(cacheKey)
  }, 30000) // 30 seconds

  return client
}

export async function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[SERVER] Missing Supabase admin environment variables")
    throw new Error("Missing Supabase admin environment variables")
  }

  const cacheKey = `${supabaseUrl}-admin`

  if (serverClientCache.has(cacheKey)) {
    return serverClientCache.get(cacheKey)!
  }

  const adminClient = createServerClient<Database>(supabaseUrl, supabaseServiceKey, {
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
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "X-Client-Info": "eriggalive-admin",
        "X-Client-Version": "1.0.0",
      },
    },
  })

  serverClientCache.set(cacheKey, adminClient)

  setTimeout(() => {
    serverClientCache.delete(cacheKey)
  }, 60000) // 60 seconds for admin client

  return adminClient
}

// Use the browser client from lib/supabase/client.ts instead

export const createServerSupabaseClient = createClient
export const createAdminSupabaseClient = createAdminClient

export function clearServerClientCache() {
  serverClientCache.clear()
}

export { createClient as createServerClient }
