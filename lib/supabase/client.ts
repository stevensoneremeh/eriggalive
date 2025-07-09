/**
 * Client-side Supabase helper with session logging
 * ------------------------------------------------------------------
 *  • Provides a singleton Supabase browser client
 *  • Logs all session state changes for debugging
 *  • Falls back to a harmless mock if the env vars are not present
 */
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

/* ------------------------------------------------------------------ */
/* Environment                                                        */
/* ------------------------------------------------------------------ */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder"

/* ------------------------------------------------------------------ */
/* Session Logging Utilities                                          */
/* ------------------------------------------------------------------ */

const LOG_PREFIX = "[Supabase Client]"

function logSessionEvent(event: string, details?: any) {
  const timestamp = new Date().toISOString()
  console.log(`${LOG_PREFIX} ${timestamp} - ${event}`, details ? JSON.stringify(details, null, 2) : "")
}

function logError(context: string, error: any) {
  const timestamp = new Date().toISOString()
  console.error(`${LOG_PREFIX} ${timestamp} - ERROR in ${context}:`, error)
}

function logWarning(context: string, message: string, details?: any) {
  const timestamp = new Date().toISOString()
  console.warn(`${LOG_PREFIX} ${timestamp} - WARNING in ${context}: ${message}`, details || "")
}

/* ------------------------------------------------------------------ */
/* Singleton with Enhanced Logging                                    */
/* ------------------------------------------------------------------ */

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  // Create a singleton supabase client on the client side
  if (!client) {
    logSessionEvent("Creating new Supabase client", {
      url: SUPABASE_URL,
      hasValidUrl: SUPABASE_URL !== "https://placeholder.supabase.co",
      hasValidKey: SUPABASE_ANON_KEY !== "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder",
    })

    try {
      client = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

      // Add session state change logging
      client.auth.onAuthStateChange((event, session) => {
        logSessionEvent(`Auth state changed: ${event}`, {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          expiresAt: session?.expires_at,
          accessToken: session?.access_token ? "present" : "missing",
          refreshToken: session?.refresh_token ? "present" : "missing",
        })

        // Log session expiry warnings
        if (session?.expires_at) {
          const expiresAt = new Date(session.expires_at * 1000)
          const now = new Date()
          const timeUntilExpiry = expiresAt.getTime() - now.getTime()
          const minutesUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60))

          if (minutesUntilExpiry < 5 && minutesUntilExpiry > 0) {
            logWarning("Session Management", `Session expires in ${minutesUntilExpiry} minutes`, {
              expiresAt: expiresAt.toISOString(),
              userId: session.user?.id,
            })
          }
        }
      })

      logSessionEvent("Supabase client created successfully")
    } catch (error) {
      logError("Client Creation", error)
      throw error
    }
  }

  return client
}

export function createClientSupabase() {
  return createClient()
}

export const supabase = createClient()
export default supabase

/* ------------------------------------------------------------------ */
/* Enhanced Auth Methods with Logging                                 */
/* ------------------------------------------------------------------ */

export const authLogger = {
  async logCurrentSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        logError("Session Check", error)
        return
      }

      logSessionEvent("Current session status", {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        isExpired: session ? new Date(session.expires_at * 1000) < new Date() : null,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      })
    } catch (error) {
      logError("Session Status Check", error)
    }
  },

  async logUserProfile(userId: string) {
    try {
      const { data: profile, error } = await supabase
        .from("users")
        .select("id, username, email, tier, level, points, coins, created_at")
        .eq("auth_user_id", userId)
        .single()

      if (error) {
        logWarning("Profile Fetch", `Could not fetch profile for user ${userId}`, error)
        return
      }

      logSessionEvent("User profile loaded", {
        userId,
        username: profile.username,
        email: profile.email,
        tier: profile.tier,
        level: profile.level,
        accountAge: profile.created_at,
      })
    } catch (error) {
      logError("Profile Logging", error)
    }
  },

  logAuthAction(action: string, success: boolean, details?: any) {
    if (success) {
      logSessionEvent(`Auth action succeeded: ${action}`, details)
    } else {
      logError(`Auth action failed: ${action}`, details)
    }
  },

  startSessionMonitoring() {
    logSessionEvent("Starting session monitoring")

    // Check session status every 5 minutes
    setInterval(
      async () => {
        await this.logCurrentSession()
      },
      5 * 60 * 1000,
    )

    // Log page visibility changes (user switching tabs)
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        logSessionEvent("Page visibility changed", {
          hidden: document.hidden,
          visibilityState: document.visibilityState,
        })
      })
    }

    // Log when user comes back online
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        logSessionEvent("User came back online")
        this.logCurrentSession()
      })

      window.addEventListener("offline", () => {
        logSessionEvent("User went offline")
      })
    }
  },
}

// Auto-start session monitoring in browser environment
if (typeof window !== "undefined") {
  authLogger.startSessionMonitoring()
}
