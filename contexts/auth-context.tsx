"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import type { Database } from "@/types/database"
import type { User } from "@supabase/supabase-js"

// Define types
type UserTier = "grassroot" | "pioneer" | "elder" | "blood_brotherhood" | "admin"

interface UserProfile {
  id: string
  email: string
  username: string
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
  refreshProfile: () => Promise<void>
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  // Function to fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error fetching user profile:", error)
        return
      }

      if (data) {
        setProfile({
          id: userId,
          email: data.email || "",
          username: data.username || "",
          tier: data.tier || "grassroot",
          coins: data.coins || 0,
          avatar_url: data.avatar_url,
          full_name: data.full_name,
          bio: data.bio,
          created_at: data.created_at,
        })
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error)
    }
  }

  // Function to refresh user profile
  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true)

        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user.id)
        }

        // Set up auth state change listener
        const {
          data: { subscription },
        } = await supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            setUser(session.user)
            await fetchUserProfile(session.user.id)
          } else {
            setUser(null)
            setProfile(null)
          }
        })

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [supabase])

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        await fetchUserProfile(data.user.id)
        router.push("/dashboard")
        return { success: true }
      }

      return { success: false, error: "Failed to sign in" }
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
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // For development/testing purposes - create a mock profile if none exists
  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === "development"

    if (isDevelopment && !user) {
      // In development, create a mock user for testing
      const mockUser = {
        id: "dev-user-id",
        email: "dev@example.com",
      } as User

      setUser(mockUser)

      const mockProfile = {
        id: mockUser.id,
        email: mockUser.email || "dev@example.com",
        username: "devuser",
        tier: "pioneer" as UserTier,
        coins: 500,
        created_at: new Date().toISOString(),
      }

      setProfile(mockProfile)
    }
  }, [user])

  return (
    <AuthContext.Provider value={{ user, profile, signIn, signOut, isLoading, refreshProfile }}>
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
