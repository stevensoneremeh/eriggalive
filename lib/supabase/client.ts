import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Singleton client instance with proper cleanup
let client: ReturnType<typeof createBrowserClient<Database>> | undefined
let clientPromise: Promise<ReturnType<typeof createBrowserClient<Database>>> | undefined

export function createClient() {
  // Return existing client if it exists
  if (client) {
    return client
  }

  // If client creation is in progress, wait for it
  if (clientPromise) {
    return clientPromise
  }

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Missing Supabase environment variables. Some features may not work properly.")
    // Return a mock client that prevents crashes
    const mockClient = {
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
              limit: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } }),
            }),
          }),
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } }),
          }),
          limit: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } }),
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        }),
        delete: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        }),
      }),
      channel: () => ({
        on: () => ({ subscribe: () => {} }),
      }),
      removeChannel: () => {},
    } as any

    client = mockClient
    return mockClient
  }

  try {
    const newClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
      global: {
        headers: {
          "X-Client-Info": "eriggalive-web",
          "X-Client-Version": "1.0.0",
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })

    client = newClient
    clientPromise = undefined
    return newClient
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    clientPromise = undefined

    const errorClient = {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: "Supabase client error" } }),
        signUp: () => Promise.resolve({ data: null, error: { message: "Supabase client error" } }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        resetPasswordForEmail: () => Promise.resolve({ error: { message: "Supabase client error" } }),
        updateUser: () => Promise.resolve({ error: { message: "Supabase client error" } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: { message: "Supabase client error" } }),
            single: () => Promise.resolve({ data: null, error: { message: "Supabase client error" } }),
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: { message: "Supabase client error" } }),
            }),
          }),
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: { message: "Supabase client error" } }),
          }),
          limit: () => Promise.resolve({ data: [], error: { message: "Supabase client error" } }),
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: "Supabase client error" } }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: "Supabase client error" } }),
        }),
        delete: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: "Supabase client error" } }),
        }),
      }),
      channel: () => ({
        on: () => ({ subscribe: () => {} }),
      }),
      removeChannel: () => {},
    } as any

    client = errorClient
    return errorClient
  }
}

export function resetClient() {
  if (client && typeof (client as any).removeAllChannels === "function") {
    try {
      ;(client as any).removeAllChannels()
    } catch (error) {
      console.warn("Error cleaning up Supabase client:", error)
    }
  }
  client = undefined
  clientPromise = undefined
}

// Export singleton getter
export function getSupabaseClient() {
  return createClient()
}

export function getBrowserClient() {
  if (!isBrowser) {
    throw new Error("getBrowserClient can only be called in browser environment")
  }
  return createClient()
}

export type SupabaseClient = ReturnType<typeof createClient>
