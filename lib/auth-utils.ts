import { createClient } from "@/lib/supabase/client"
import { serverAuthLogger } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

export interface AuthUser extends User {
  tier?: "admin" | "mod" | "elder" | "blood" | "pioneer" | "grassroot"
  username?: string
  full_name?: string
  avatar_url?: string
  level?: number
  points?: number
  coins?: number
}

/* ------------------------------------------------------------------ */
/* Client Auth Logging                                                */
/* ------------------------------------------------------------------ */

const LOG_PREFIX = "[Auth Utils]"

function logAuthUtils(event: string, details?: any) {
  const timestamp = new Date().toISOString()
  console.log(`${LOG_PREFIX} ${timestamp} - ${event}`, details ? JSON.stringify(details, null, 2) : "")
}

function logAuthUtilsError(context: string, error: any) {
  const timestamp = new Date().toISOString()
  console.error(`${LOG_PREFIX} ${timestamp} - ERROR in ${context}:`, error)
}

export class ClientAuth {
  private supabase = createClient()

  async getCurrentUser(): Promise<AuthUser | null> {
    logAuthUtils("Getting current user")

    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser()

      if (error || !user) {
        logAuthUtils("No current user found", { error: error?.message })
        return null
      }

      logAuthUtils("Current user found", { userId: user.id, email: user.email })

      // Fetch additional user profile data
      const { data: profile, error: profileError } = await this.supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", user.id)
        .single()

      if (profileError) {
        logAuthUtilsError("Profile fetch", profileError)
      }

      const authUser: AuthUser = {
        ...user,
        tier: profile?.tier || "grassroot",
        username: profile?.username || user.email?.split("@")[0],
        full_name: profile?.full_name || user.user_metadata?.full_name,
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
        level: profile?.level || 1,
        points: profile?.points || 0,
        coins: profile?.coins || 1000,
      }

      logAuthUtils("User profile assembled", {
        userId: user.id,
        tier: authUser.tier,
        level: authUser.level,
        coins: authUser.coins,
      })

      return authUser
    } catch (error) {
      logAuthUtilsError("getCurrentUser", error)
      return null
    }
  }

  async signIn(email: string, password: string) {
    logAuthUtils("Sign in attempt", { email })

    const result = await this.supabase.auth.signInWithPassword({ email, password })

    if (result.error) {
      logAuthUtilsError("Sign in", result.error)
    } else {
      logAuthUtils("Sign in successful", { userId: result.data.user?.id })
    }

    return result
  }

  async signUp(email: string, password: string, options?: { data?: any }) {
    logAuthUtils("Sign up attempt", { email, hasOptions: !!options })

    const result = await this.supabase.auth.signUp({ email, password, options })

    if (result.error) {
      logAuthUtilsError("Sign up", result.error)
    } else {
      logAuthUtils("Sign up successful", { userId: result.data.user?.id })
    }

    return result
  }

  async signOut() {
    logAuthUtils("Sign out attempt")

    const result = await this.supabase.auth.signOut()

    if (result.error) {
      logAuthUtilsError("Sign out", result.error)
    } else {
      logAuthUtils("Sign out successful")
    }

    return result
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    logAuthUtils("Setting up auth state change listener")

    return this.supabase.auth.onAuthStateChange((event, session) => {
      logAuthUtils("Auth state change", { event, hasSession: !!session })
      callback(event, session)
    })
  }

  async getSession() {
    logAuthUtils("Getting session")

    const result = await this.supabase.auth.getSession()

    logAuthUtils("Session retrieved", {
      hasSession: !!result.data.session,
      error: result.error?.message,
    })

    return result
  }

  async refreshSession() {
    logAuthUtils("Refreshing session")

    const result = await this.supabase.auth.refreshSession()

    if (result.error) {
      logAuthUtilsError("Session refresh", result.error)
    } else {
      logAuthUtils("Session refreshed successfully")
    }

    return result
  }

  // Check if user has specific tier access
  async hasAccess(requiredTier: string): Promise<boolean> {
    logAuthUtils("Checking tier access", { requiredTier })

    const user = await this.getCurrentUser()
    if (!user?.tier) {
      logAuthUtils("Access denied - no user tier", { requiredTier })
      return false
    }

    const tierHierarchy = ["grassroot", "pioneer", "blood", "elder", "mod", "admin"]
    const userTierIndex = tierHierarchy.indexOf(user.tier)
    const requiredTierIndex = tierHierarchy.indexOf(requiredTier)
    const hasAccess = userTierIndex >= requiredTierIndex

    logAuthUtils("Tier access check result", {
      userTier: user.tier,
      requiredTier,
      hasAccess,
    })

    // Log access attempt for audit purposes
    await serverAuthLogger.logUserAccess(user.id, `tier:${requiredTier}`, hasAccess)

    return hasAccess
  }

  // Get user's subscription status
  async getSubscriptionStatus() {
    logAuthUtils("Getting subscription status")

    const user = await this.getCurrentUser()
    const status = {
      tier: user?.tier || "grassroot",
      isSubscribed: user?.tier !== "grassroot",
      level: user?.level || 1,
      points: user?.points || 0,
      coins: user?.coins || 1000,
    }

    logAuthUtils("Subscription status", status)

    return status
  }

  // Monitor session health
  async monitorSessionHealth() {
    logAuthUtils("Starting session health monitoring")

    setInterval(
      async () => {
        try {
          const {
            data: { session },
            error,
          } = await this.supabase.auth.getSession()

          if (error) {
            logAuthUtilsError("Session health check", error)
            return
          }

          if (session) {
            const expiresAt = new Date(session.expires_at * 1000)
            const now = new Date()
            const timeUntilExpiry = expiresAt.getTime() - now.getTime()
            const minutesUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60))

            logAuthUtils("Session health check", {
              userId: session.user.id,
              expiresAt: expiresAt.toISOString(),
              minutesUntilExpiry,
              isHealthy: minutesUntilExpiry > 5,
            })

            // Auto-refresh if expiring soon
            if (minutesUntilExpiry < 5 && minutesUntilExpiry > 0) {
              logAuthUtils("Auto-refreshing session due to upcoming expiry")
              await this.refreshSession()
            }
          }
        } catch (error) {
          logAuthUtilsError("Session health monitoring", error)
        }
      },
      2 * 60 * 1000,
    ) // Check every 2 minutes
  }
}

export const clientAuth = new ClientAuth()

// Auto-start session monitoring in browser environment
if (typeof window !== "undefined") {
  clientAuth.monitorSessionHealth()
}
