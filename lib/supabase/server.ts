import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

/* ------------------------------------------------------------------ */
/* Server-side Session Logging                                       */
/* ------------------------------------------------------------------ */

const LOG_PREFIX = "[Supabase Server]"

function logServerEvent(event: string, details?: any) {
  const timestamp = new Date().toISOString()
  console.log(`${LOG_PREFIX} ${timestamp} - ${event}`, details ? JSON.stringify(details, null, 2) : "")
}

function logServerError(context: string, error: any) {
  const timestamp = new Date().toISOString()
  console.error(`${LOG_PREFIX} ${timestamp} - ERROR in ${context}:`, error)
}

function logServerWarning(context: string, message: string, details?: any) {
  const timestamp = new Date().toISOString()
  console.warn(`${LOG_PREFIX} ${timestamp} - WARNING in ${context}: ${message}`, details || "")
}

export async function createClient() {
  const cookieStore = await cookies()

  logServerEvent("Creating server client", {
    hasCookies: cookieStore.getAll().length > 0,
    cookieCount: cookieStore.getAll().length,
  })

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const allCookies = cookieStore.getAll()
          const authCookies = allCookies.filter(
            (cookie) =>
              cookie.name.startsWith("sb-") || cookie.name.includes("auth") || cookie.name.includes("session"),
          )

          if (authCookies.length > 0) {
            logServerEvent("Reading auth cookies", {
              authCookieCount: authCookies.length,
              cookieNames: authCookies.map((c) => c.name),
            })
          }

          return allCookies
        },
        setAll(cookiesToSet) {
          try {
            const authCookies = cookiesToSet.filter(
              (cookie) =>
                cookie.name.startsWith("sb-") || cookie.name.includes("auth") || cookie.name.includes("session"),
            )

            if (authCookies.length > 0) {
              logServerEvent("Setting auth cookies", {
                cookieCount: authCookies.length,
                cookieNames: authCookies.map((c) => c.name),
              })
            }

            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch (error) {
            logServerError("Cookie Setting", error)
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    },
  )
}

export async function createServerSupabaseClient() {
  return createClient()
}

export async function createAdminClient() {
  logServerEvent("Creating admin client")

  return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {
        // Admin client doesn't need cookies
      },
    },
  })
}

/* ------------------------------------------------------------------ */
/* Server-side Auth Utilities with Logging                           */
/* ------------------------------------------------------------------ */

export const serverAuthLogger = {
  async logServerSession(context = "Server Check") {
    try {
      const supabase = await createClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        logServerError("Server Session Check", error)
        return null
      }

      logServerEvent(`${context} - Server session status`, {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        lastSignIn: user?.last_sign_in_at,
        emailConfirmed: user?.email_confirmed_at ? true : false,
      })

      return user
    } catch (error) {
      logServerError("Server Session Logging", error)
      return null
    }
  },

  async logUserAccess(userId: string, resource: string, allowed: boolean) {
    try {
      const supabase = await createClient()
      const { data: profile } = await supabase
        .from("users")
        .select("username, tier")
        .eq("auth_user_id", userId)
        .single()

      logServerEvent("User access attempt", {
        userId,
        username: profile?.username,
        tier: profile?.tier,
        resource,
        allowed,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      logServerError("Access Logging", error)
    }
  },

  logMiddlewareAction(action: string, path: string, details?: any) {
    logServerEvent(`Middleware: ${action}`, {
      path,
      ...details,
    })
  },
}
