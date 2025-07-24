"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface UserProfile {
  id: string
  auth_user_id: string
  username: string
  full_name?: string
  email: string
  avatar_url?: string
  tier: string
  coins_balance: number
  level: number
  points: number
  reputation_score: number
  role: string
  is_active: boolean
  is_verified: boolean
  is_banned: boolean
  last_seen: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  isPreviewMode: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (
    email: string,
    password: string,
    username: string,
    fullName?: string,
  ) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPreviewMode] = useState(false) // Set to true for preview mode
  const supabase = createClient()

  // Fetch user profile
  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).single()

        if (error) {
          console.error("Error fetching profile:", error)
          return null
        }

        return data as UserProfile
      } catch (error) {
        console.error("Unexpected error fetching profile:", error)
        return null
      }
    },
    [supabase],
  )

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          if (mounted) {
            setIsLoading(false)
          }
          return
        }

        if (session?.user && mounted) {
          setUser(session.user)
          const userProfile = await fetchProfile(session.user.id)
          if (mounted) {
            setProfile(userProfile)
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        const userProfile = await fetchProfile(session.user.id)
        setProfile(userProfile)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
      }

      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  // Sign in function
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          return { success: false, error: error.message }
        }

        if (data.user) {
          const userProfile = await fetchProfile(data.user.id)
          setProfile(userProfile)
        }

        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "An unexpected error occurred",
        }
      }
    },
    [supabase, fetchProfile],
  )

  // Sign up function
  const signUp = useCallback(
    async (email: string, password: string, username: string, fullName?: string) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              full_name: fullName || "",
            },
          },
        })

        if (error) {
          return { success: false, error: error.message }
        }

        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "An unexpected error occurred",
        }
      }
    },
    [supabase],
  )

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }, [supabase])

  // Update profile function
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user || !profile) {
        return { success: false, error: "Not authenticated" }
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .update(updates)
          .eq("auth_user_id", user.id)
          .select()
          .single()

        if (error) {
          return { success: false, error: error.message }
        }

        setProfile(data as UserProfile)
        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "An unexpected error occurred",
        }
      }
    },
    [supabase, user, profile],
  )

  // Refresh profile function
  const refreshProfile = useCallback(async () => {
    if (!user) return

    const userProfile = await fetchProfile(user.id)
    setProfile(userProfile)
  }, [user, fetchProfile])

  const value: AuthContextType = {
    user,
    profile,
    isAuthenticated: !!user,
    isLoading,
    isPreviewMode,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
