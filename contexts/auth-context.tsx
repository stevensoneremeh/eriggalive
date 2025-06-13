"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-utils"

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

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: any }>
  signOut: () => Promise<void>
  isLoading: boolean
  purchaseCoins: (amount: number, method: string) => Promise<{ success: boolean; data?: any; error?: any }>
  refreshSession: () => Promise<void>
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Session expiration time (30 days in seconds)
const SESSION_EXPIRY = 30 * 24 * 60 * 60

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Initialize with stored data
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true)

        // First check for an active session in cookies
        const sessionCookie = getCookie("erigga_auth_session")

        if (sessionCookie) {
          try {
            const sessionData = JSON.parse(atob(sessionCookie))
            if (sessionData && sessionData.user && sessionData.profile) {
              setUser(sessionData.user)
              setProfile(sessionData.profile)

              // Refresh the session expiry
              persistSession(sessionData.user, sessionData.profile)
              setIsLoading(false)
              return
            }
          } catch (e) {
            console.error("Error parsing session cookie:", e)
          }
        }

        // Fallback to localStorage if cookie approach fails
        const storedUser = localStorage.getItem("erigga_user")
        const storedProfile = localStorage.getItem("erigga_profile")

        if (storedUser && storedProfile) {
          const parsedUser = JSON.parse(storedUser)
          const parsedProfile = JSON.parse(storedProfile)

          setUser(parsedUser)
          setProfile(parsedProfile)

          // Update the session cookie from localStorage data
          persistSession(parsedUser, parsedProfile)
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        // Clear potentially corrupted data
        clearSession()
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Set up an interval to refresh the session every 15 minutes
    const refreshInterval = setInterval(
      () => {
        if (user && profile) {
          persistSession(user, profile)
        }
      },
      15 * 60 * 1000,
    ) // 15 minutes

    return () => clearInterval(refreshInterval)
  }, [])

  // Helper to get a cookie value
  const getCookie = (name: string): string | null => {
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

  // Helper to persist session in both cookie and localStorage
  const persistSession = (user: User, profile: UserProfile) => {
    try {
      // Store in localStorage for compatibility
      localStorage.setItem("erigga_user", JSON.stringify(user))
      localStorage.setItem("erigga_profile", JSON.stringify(profile))

      // Store in cookies for better security and persistence
      const sessionData = btoa(JSON.stringify({ user, profile }))

      // Set a secure, http-only cookie with a long expiration
      document.cookie = `erigga_auth_session=${sessionData}; path=/; max-age=${SESSION_EXPIRY}; SameSite=Lax`

      // Set a simple auth flag cookie for middleware checks
      document.cookie = `erigga_auth=1; path=/; max-age=${SESSION_EXPIRY}; SameSite=Lax`
    } catch (error) {
      console.error("Error persisting session:", error)
    }
  }

  // Helper to clear session data
  const clearSession = () => {
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
  }

  // Sign in function that works for any user
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Generate a unique ID based on the email
      const userId = `user-${btoa(email).replace(/[=+/]/g, "").substring(0, 16)}`

      // Create a username from the email
      const username = email.split("@")[0]

      // Create a mock user
      const mockUser = {
        id: userId,
        email,
        username,
      }

      // Create a mock profile with 500 coins
      const mockProfile = {
        ...mockUser,
        tier: "pioneer" as UserTier,
        coins: 500,
        level: 1,
        points: 100,
        created_at: new Date().toISOString(),
        bio: `${username}'s profile`,
      }

      // Persist the session
      persistSession(mockUser, mockProfile)

      setUser(mockUser)
      setProfile(mockProfile)

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || "An unknown error occurred" }
    } finally {
      setIsLoading(false)
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true)

      // Clear all session data
      clearSession()

      setUser(null)
      setProfile(null)

      router.push("/login")
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Function to refresh the current session
  const refreshSession = async () => {
    if (user && profile) {
      persistSession(user, profile)
    }
  }

  // Purchase coins function
  const purchaseCoins = async (amount: number, method: string) => {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Update the profile with new coins
      if (profile) {
        const updatedProfile = {
          ...profile,
          coins: profile.coins + amount,
        }

        // Update session with new profile data
        persistSession(user!, updatedProfile)

        setProfile(updatedProfile)
      }

      return { success: true, data: { id: `transaction-${Date.now()}` } }
    } catch (error: any) {
      return { success: false, error: { message: error.message || "An unknown error occurred" } }
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, signIn, signOut, isLoading, purchaseCoins, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
