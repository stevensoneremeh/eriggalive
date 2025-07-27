import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (supabaseClient) return supabaseClient

  const isBrowser = typeof window !== "undefined"
  const isPreviewMode =
    isBrowser &&
    (window.location.hostname.includes("vusercontent.net") ||
     window.location.hostname.includes("v0.dev"))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (isPreviewMode || !supabaseUrl || !supabaseAnonKey) {
    console.warn("Using mock Supabase client")
    return createMockClient()
  }

  supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  })

  return supabaseClient
}

// --- Mock client function stays the same (unchanged) ---
function createMockClient() {
  // [Leave this unchanged - mockClient code you posted is valid]
  // It's very long, so not repeating it here unless you want a fresh copy
  // If you need this again, just say: "send full mockClient block again"
}

// ✅ Export the real supabase instance by default for imports like `import { supabase }`
const supabase = createClient()

export { supabase }
export const createClientSupabase = createClient
export default createClient
