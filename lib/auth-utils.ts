import { cookies } from "next/headers"

// Session expiration time (30 days in seconds)
export const SESSION_EXPIRY = 30 * 24 * 60 * 60

// Check if user is authenticated on the server side
export function isAuthenticated() {
  const cookieStore = cookies()
  return cookieStore.has("erigga_auth") || cookieStore.has("erigga_auth_session")
}

// Get user session data on the server side
export function getServerSession() {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get("erigga_auth_session")

  if (!sessionCookie?.value) return null

  try {
    return JSON.parse(Buffer.from(sessionCookie.value, "base64").toString())
  } catch (error) {
    console.error("Error parsing session cookie:", error)
    return null
  }
}

// Client-side functions for session management
export const clientAuth = {
  // Get session from cookies or localStorage
  getSession: () => {
    try {
      // Try to get from cookie first
      const sessionCookie = getCookie("erigga_auth_session")
      if (sessionCookie) {
        try {
          return JSON.parse(atob(sessionCookie))
        } catch (e) {
          console.error("Error parsing session cookie:", e)
        }
      }

      // Fallback to localStorage
      const storedUser = localStorage.getItem("erigga_user")
      const storedProfile = localStorage.getItem("erigga_profile")

      if (storedUser && storedProfile) {
        return {
          user: JSON.parse(storedUser),
          profile: JSON.parse(storedProfile),
          timestamp: Date.now(),
        }
      }

      return null
    } catch (error) {
      console.error("Error getting session:", error)
      return null
    }
  },

  // Save session to both cookies and localStorage
  saveSession: (user, profile) => {
    try {
      // Store in localStorage for compatibility
      localStorage.setItem("erigga_user", JSON.stringify(user))
      localStorage.setItem("erigga_profile", JSON.stringify(profile))

      // Store in cookies for better security and persistence
      const sessionData = btoa(JSON.stringify({ user, profile, timestamp: Date.now() }))

      // Set a secure cookie with a long expiration
      document.cookie = `erigga_auth_session=${sessionData}; path=/; max-age=${SESSION_EXPIRY}; SameSite=Lax`

      // Set a simple auth flag cookie for middleware checks
      document.cookie = `erigga_auth=1; path=/; max-age=${SESSION_EXPIRY}; SameSite=Lax`

      return true
    } catch (error) {
      console.error("Error saving session:", error)
      return false
    }
  },

  // Clear session data
  clearSession: () => {
    try {
      // Clear localStorage
      localStorage.removeItem("erigga_user")
      localStorage.removeItem("erigga_profile")

      // Clear cookies
      document.cookie = "erigga_auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      document.cookie = "erigga_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

      return true
    } catch (error) {
      console.error("Error clearing session:", error)
      return false
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getCookie("erigga_auth") || !!getCookie("erigga_auth_session") || !!localStorage.getItem("erigga_user")
  },

  // Refresh the session
  refreshSession: () => {
    const session = clientAuth.getSession()
    if (session?.user && session?.profile) {
      return clientAuth.saveSession(session.user, session.profile)
    }
    return false
  },
}

// Helper to get a cookie value
function getCookie(name) {
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
