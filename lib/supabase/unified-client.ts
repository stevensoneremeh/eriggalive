import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase/server"

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

// Legacy compatibility exports
export { createBrowserClient as createClient }
export { createServerClient }
