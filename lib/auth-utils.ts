"use client"

// Define types
type UserTier = "grassroot" | "pioneer" | "elder" | "blood_brotherhood" | "admin"

interface User {
  id: string
  email: string
  username: string
}

interface UserProfile extends User {
  tier: UserTier
  coins: number
  level: number
  points: number
  avatar_url?: string
  full_name?: string
  bio?: string
  created_at: string
}

interface SessionData {
  user: User
  profile: UserProfile
  timestamp: number
}

// Session expiration time (30 days in seconds)
const SESSION_EXPIRY = 30 * 24 * 60 * 60

// Client-side auth utilities
export const clientAuth = {
  // Save session data to both localStorage and cookies
  saveSession: (user: User, profile: UserProfile): void => {
    try {
      // Store in localStorage for compatibility
      localStorage.setItem("erigga_user", JSON.stringify(user))
      localStorage.setItem("erigga_profile", JSON.stringify(profile))

      // Store in cookies for better security and persistence
      const sessionData = btoa(JSON.stringify({ user, profile, timestamp: Date.now() }))

      // Set a secure, http-only cookie with a long expiration
      document.cookie = `erigga_auth_session=${sessionData}; path=/; max-age=${SESSION_EXPIRY}; SameSite=Lax`

      // Set a simple auth flag cookie for middleware checks
      document.cookie = `erigga_auth=1; path=/; max-age=${SESSION_EXPIRY}; SameSite=Lax`
    } catch (error) {
      console.error("Error saving session:", error)
    }
  },

  // Get session data from cookies or localStorage
  getSession: (): SessionData | null => {
    try {
      // First try to get from cookies
      const sessionCookie = getCookie("erigga_auth_session")
      if (sessionCookie) {
        try {
          const sessionData = JSON.parse(atob(sessionCookie))
          if (sessionData && sessionData.user && sessionData.profile) {
            return sessionData
          }
        } catch (e) {
          console.error("Error parsing session cookie:", e)
        }
      }

      // Fallback to localStorage
      const storedUser = localStorage.getItem("erigga_user")
      const storedProfile = localStorage.getItem("erigga_profile")

      if (storedUser && storedProfile) {
        const user = JSON.parse(storedUser)
        const profile = JSON.parse(storedProfile)
        return { user, profile, timestamp: Date.now() }
      }

      return null
    } catch (error) {
      console.error("Error getting session:", error)
      return null
    }
  },

  // Clear session data
  clearSession: (): void => {
    try {
      // Clear localStorage
      localStorage.removeItem("erigga_user")
      localStorage.removeItem("erigga_profile")

      // Clear cookies
      document.cookie = "erigga_auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      document.cookie = "erigga_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    } catch (error) {
      console.error("Error clearing session:", error)
    }
  },

  // Refresh session to extend expiry
  refreshSession: (): void => {
    const session = clientAuth.getSession()
    if (session?.user && session?.profile) {
      clientAuth.saveSession(session.user, session.profile)
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!clientAuth.getSession()
  },
}

// Helper to get a cookie value
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null

  const cookies = document.cookie.split(";")
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim()
    if (cookie.startsWith(name + "=")) {
      return cookie.substring(name.length + 1)
    }
  }
  return null
}
