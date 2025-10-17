import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from './client'
import { shouldAllowRequest } from '../request-limiter'

// Unified client factory that chooses the right client based on environment
export function getSupabaseClient() {
  if (typeof window !== "undefined") {
    // Browser environment - use browser client
    return createBrowserClient()
  } else {
    // Server environment - throw error as server client needs cookies
    throw new Error(
      "Server-side Supabase client requires cookies. Use createClient() from @/lib/supabase/server instead.",
    )
  }
}

// Type-safe client getter for components that need to work in both environments
export function createUnifiedClient() {
  if (typeof window !== "undefined") {
    return createBrowserClient()
  } else {
    // Return a mock client for SSR that will be replaced on hydration
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
    } as any
  }
}

// Re-export the correct clients
export { createClient as createBrowserClient } from "@/lib/supabase/client"
export { createClient as createServerClient } from "@/lib/supabase/server"

export const getSupabase = () => {
  const client = createClient()

  // Wrap the from method to add rate limiting
  const originalFrom = client.from.bind(client)
  client.from = (table: string) => {
    const requestKey = `supabase_${table}_${Date.now()}`
    if (!shouldAllowRequest(requestKey)) {
      console.warn(`Rate limit: Skipping duplicate request to ${table}`)
    }
    return originalFrom(table)
  }

  return client
}