"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

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
  avatar_url?: string
  full_name?: string
  bio?: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  isLoading: boolean
  isPreviewMode: boolean
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Always true in v0 preview
  const isPreviewMode = true

  // Initialize with mock data for preview
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // In preview mode, we'll use mock data
        if (isPreviewMode) {
          // Simulate a delay for loading state
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // 50% chance of being logged in for demo purposes
          const isLoggedIn = Math.random() > 0.5

          if (isLoggedIn) {
            const mockUser = {
              id: "preview-user-id",
              email: "fan@eriggalive.com",
              username: "EriggaFan",
            }

            const mockProfile = {
              ...mockUser,
              tier: ["grassroot", "pioneer", "elder", "blood_brotherhood"][Math.floor(Math.random() * 4)] as UserTier,
              coins: Math.floor(Math.random() * 1000),
              created_at: new Date().toISOString(),
              bio: "This is a preview mode user profile.",
            }

            setUser(mockUser)
            setProfile(mockProfile)
          }
        } else {
          // Real authentication logic would go here
          // const { data: { session } } = await supabase.auth.getSession()
          // if (session) { ... }
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [isPreviewMode])

  // Mock sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      if (isPreviewMode) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Always succeed in preview mode with mock data
        const mockUser = {
          id: "preview-user-id",
          email,
          username: email.split("@")[0],
        }

        const mockProfile = {
          ...mockUser,
          tier: "pioneer" as UserTier,
          coins: 500,
          created_at: new Date().toISOString(),
          bio: "This is a preview mode user profile.",
        }

        setUser(mockUser)
        setProfile(mockProfile)

        return { success: true }
      }

      // Real sign in logic would go here
      return { success: false, error: "Authentication only works when deployed" }
    } catch (error: any) {
      return { success: false, error: error.message || "An unknown error occurred" }
    } finally {
      setIsLoading(false)
    }
  }

  // Mock sign out function
  const signOut = async () => {
    try {
      setIsLoading(true)

      if (isPreviewMode) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setUser(null)
        setProfile(null)
      } else {
        // Real sign out logic would go here
      }
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, signIn, signOut, isLoading, isPreviewMode }}>
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
