"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { clientAuth } from "@/lib/auth-utils"
import { NavigationManager, ROUTES, getRedirectPath } from "@/lib/navigation-utils"

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
  signUp: (
    email: string,
    password: string,
    username: string,
    fullName: string,
  ) => Promise<{ success: boolean; error?: any }>
  signOut: () => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
  isInitialized: boolean
  purchaseCoins: (amount: number, method: string) => Promise<{ success: boolean; data?: any; error?: any }>
  refreshSession: () => Promise<void>
  navigationManager: NavigationManager | null
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Create navigation manager
  const navigationManager = new NavigationManager(router, pathname)

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true)

        // Get session from our utility
        const session = clientAuth.getSession()

        if (session?.user && session?.profile) {
          setUser(session.user)
          setProfile(session.profile)
          setIsAuthenticated(true)

          // Refresh the session to extend expiry
          clientAuth.refreshSession()

          // Handle post-initialization navigation for authenticated users
          if (navigationManager.isAuthRoute(pathname)) {
            // User is authenticated but on auth page, redirect to dashboard
            const redirectPath = getRedirectPath(searchParams)
            navigationManager.handlePostLoginNavigation(redirectPath)
          }
        } else {
          setIsAuthenticated(false)

          // Handle unauthenticated users on protected routes
          if (navigationManager.isProtectedRoute(pathname)) {
            navigationManager.handleAuthRequiredNavigation(pathname)
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        setIsAuthenticated(false)

        // Handle initialization error on protected routes
        if (navigationManager.isProtectedRoute(pathname)) {
          navigationManager.handleAuthRequiredNavigation(pathname)
        }
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, []) // Only run once on mount

  // Handle route changes for authenticated users
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      // Refresh session on route changes
      clientAuth.refreshSession()

      // Redirect away from auth routes if authenticated
      if (navigationManager.isAuthRoute(pathname)) {
        const redirectPath = getRedirectPath(searchParams)
        navigationManager.handlePostLoginNavigation(redirectPath)
      }
    }
  }, [pathname, isAuthenticated, isInitialized])

  // Set up periodic session refresh
  useEffect(() => {
    if (!isAuthenticated) return

    const refreshInterval = setInterval(
      () => {
        try {
          clientAuth.refreshSession()
        } catch (error) {
          console.error("Session refresh error:", error)
          // If refresh fails, sign out the user
          signOut()
        }
      },
      5 * 60 * 1000, // Every 5 minutes
    )

    return () => clearInterval(refreshInterval)
  }, [isAuthenticated])

  // Enhanced sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      // Validate inputs
      if (!email || !password) {
        return { success: false, error: "Email and password are required" }
      }

      // Simulate API delay for realistic UX
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

      // Persist the session using our utility
      clientAuth.saveSession(mockUser, mockProfile)

      setUser(mockUser)
      setProfile(mockProfile)
      setIsAuthenticated(true)

      // Handle post-login navigation
      const redirectPath = getRedirectPath(searchParams)

      // Small delay to ensure state is updated before navigation
      setTimeout(() => {
        navigationManager.handlePostLoginNavigation(redirectPath)
      }, 100)

      return { success: true }
    } catch (error: any) {
      console.error("Sign in error:", error)
      return {
        success: false,
        error: error.message || "An unexpected error occurred during sign in",
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Enhanced sign up function
  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    try {
      setIsLoading(true)

      // Validate inputs
      if (!email || !password || !username || !fullName) {
        return { success: false, error: { message: "All fields are required" } }
      }

      if (password.length < 6) {
        return { success: false, error: { message: "Password must be at least 6 characters" } }
      }

      // Simulate API delay for realistic UX
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generate a unique ID based on the email
      const userId = `user-${btoa(email).replace(/[=+/]/g, "").substring(0, 16)}`

      // Create a mock user
      const mockUser = {
        id: userId,
        email,
        username,
      }

      // Create a mock profile with welcome bonus coins
      const mockProfile = {
        ...mockUser,
        tier: "grassroot" as UserTier,
        coins: 100, // Welcome bonus
        level: 1,
        points: 0,
        full_name: fullName,
        created_at: new Date().toISOString(),
        bio: `Welcome to the movement, ${username}!`,
      }

      // Persist the session using our utility
      clientAuth.saveSession(mockUser, mockProfile)

      setUser(mockUser)
      setProfile(mockProfile)
      setIsAuthenticated(true)

      return { success: true }
    } catch (error: any) {
      console.error("Sign up error:", error)
      return {
        success: false,
        error: { message: error.message || "An unexpected error occurred during sign up" },
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Enhanced sign out function
  const signOut = async () => {
    try {
      setIsLoading(true)

      // Clear session using our utility
      clientAuth.clearSession()

      setUser(null)
      setProfile(null)
      setIsAuthenticated(false)

      // Navigate to login page
      navigationManager.navigateTo(ROUTES.LOGIN, { replace: true })
    } catch (error) {
      console.error("Sign out error:", error)

      // Force navigation even if there's an error
      try {
        router.push(ROUTES.LOGIN)
      } catch (navError) {
        console.error("Emergency navigation failed:", navError)
        // Last resort: reload the page
        if (typeof window !== "undefined") {
          window.location.href = ROUTES.LOGIN
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Function to refresh the current session
  const refreshSession = async () => {
    if (user && profile) {
      try {
        clientAuth.saveSession(user, profile)
      } catch (error) {
        console.error("Session refresh error:", error)
      }
    }
  }

  // Enhanced purchase coins function
  const purchaseCoins = async (amount: number, method: string) => {
    try {
      // Validate inputs
      if (!amount || amount <= 0) {
        return { success: false, error: { message: "Invalid coin amount" } }
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Update the profile with new coins
      if (profile) {
        const updatedProfile = {
          ...profile,
          coins: profile.coins + amount,
        }

        // Update session with new profile data
        clientAuth.saveSession(user!, updatedProfile)

        setProfile(updatedProfile)
      }

      return { success: true, data: { id: `transaction-${Date.now()}` } }
    } catch (error: any) {
      console.error("Purchase coins error:", error)
      return {
        success: false,
        error: { message: error.message || "Failed to purchase coins" },
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        signIn,
        signUp,
        signOut,
        isLoading,
        isAuthenticated,
        isInitialized,
        purchaseCoins,
        refreshSession,
        navigationManager,
      }}
    >
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
