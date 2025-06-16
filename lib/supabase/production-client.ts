import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Production Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

// Client-side Supabase client (browser)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      "X-Client-Info": "erigga-platform@1.0.0",
    },
  },
})

// Server-side Supabase client (admin)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      "X-Client-Info": "erigga-platform-admin@1.0.0",
    },
  },
})

// Connection pool configuration for server-side
export const createServerClient = () => {
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "X-Client-Info": "erigga-platform-server@1.0.0",
      },
    },
  })
}

// Health check function
export async function checkSupabaseHealth(): Promise<{
  status: "healthy" | "unhealthy"
  latency: number
  error?: string
}> {
  const start = Date.now()

  try {
    const { error } = await supabase.from("users").select("count").limit(1).single()

    const latency = Date.now() - start

    if (error && !error.message.includes("PGRST116")) {
      return {
        status: "unhealthy",
        latency,
        error: error.message,
      }
    }

    return {
      status: "healthy",
      latency,
    }
  } catch (error) {
    return {
      status: "unhealthy",
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Real-time subscriptions manager
export class RealtimeManager {
  private subscriptions = new Map<string, any>()

  subscribe(channel: string, table: string, callback: (payload: any) => void) {
    const subscription = supabase
      .channel(channel)
      .on("postgres_changes", { event: "*", schema: "public", table }, callback)
      .subscribe()

    this.subscriptions.set(channel, subscription)
    return subscription
  }

  unsubscribe(channel: string) {
    const subscription = this.subscriptions.get(channel)
    if (subscription) {
      subscription.unsubscribe()
      this.subscriptions.delete(channel)
    }
  }

  unsubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe()
    })
    this.subscriptions.clear()
  }
}

export const realtimeManager = new RealtimeManager()
