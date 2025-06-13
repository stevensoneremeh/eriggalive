"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

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
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Initialize with stored data
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have a stored user in localStorage
        const storedUser = localStorage.getItem("erigga_user")
        const storedProfile = localStorage.getItem("erigga_profile")

        if (storedUser && storedProfile) {
          setUser(JSON.parse(storedUser))
          setProfile(JSON.parse(storedProfile))
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

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

      // Store in localStorage for persistence
      localStorage.setItem("erigga_user", JSON.stringify(mockUser))
      localStorage.setItem("erigga_profile", JSON.stringify(mockProfile))

      // Set a cookie for authentication
      document.cookie = `erigga_auth=${userId}; path=/; max-age=86400; SameSite=Lax`

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

      // Clear localStorage
      localStorage.removeItem("erigga_user")
      localStorage.removeItem("erigga_profile")

      // Clear cookie
      document.cookie = "erigga_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

      setUser(null)
      setProfile(null)

      router.push("/login")
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      setIsLoading(false)
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

        // Update localStorage
        localStorage.setItem("erigga_profile", JSON.stringify(updatedProfile))

        setProfile(updatedProfile)
      }

      return { success: true, data: { id: `transaction-${Date.now()}` } }
    } catch (error: any) {
      return { success: false, error: { message: error.message || "An unknown error occurred" } }
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, signIn, signOut, isLoading, purchaseCoins }}>
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
