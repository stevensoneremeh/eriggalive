"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

type UserProfile = Database["public"]["Tables"]["users"]["Row"]

interface AuthContextType {
  user: SupabaseUser | null
  profile: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, userData: any) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>
  refreshSession: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  const fetchUserProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).single()

        if (error) {
          console.error("Error fetching user profile:", error)
          return null
        }

        return data
      } catch (error) {
        console.error("Error in fetchUserProfile:", error)
        return null
      }
    },
    [supabase],
  )

  const refreshProfile = useCallback(async () => {
    if (!user) return

    const userProfile = await fetchUserProfile(user.id)
    setProfile(userProfile)
  }, [user, fetchUserProfile])

  const refreshSession = useCallback(async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession()
      if (error) {
        console.error("Error refreshing session:", error)
        return
      }

      if (session?.user) {
        setUser(session.user)
        const userProfile = await fetchUserProfile(session.user.id)
        setProfile(userProfile)
      }
    } catch (error) {
      console.error("Error in refreshSession:", error)
    }
  }, [supabase, fetchUserProfile])

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          setLoading(false)
          return
        }

        if (session?.user) {
          setUser(session.user)
          const userProfile = await fetchUserProfile(session.user.id)
          setProfile(userProfile)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id)

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        const userProfile = await fetchUserProfile(session.user.id)
        setProfile(userProfile)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        setUser(session.user)
        // Optionally refresh profile on token refresh
        const userProfile = await fetchUserProfile(session.user.id)
        setProfile(userProfile)
      }

      setLoading(false)
    })

    // Set up periodic session refresh
    const refreshInterval = setInterval(refreshSession, 5 * 60 * 1000) // Every 5 minutes

    return () => {
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [supabase, fetchUserProfile, refreshSession])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      if (data.user) {
        setUser(data.user)
        const userProfile = await fetchUserProfile(data.user.id)
        setProfile(userProfile)

        // Update last login
        if (userProfile) {
          await supabase
            .from("users")
            .update({
              last_login: new Date().toISOString(),
              login_count: (userProfile.login_count || 0) + 1,
            })
            .eq("auth_user_id", data.user.id)
        }
      }

      return {}
    } catch (error) {
      console.error("Sign in error:", error)
      return { error: "An unexpected error occurred" }
    }
  }

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase.from("users").insert({
          auth_user_id: data.user.id,
          email: data.user.email!,
          username: userData.username,
          full_name: userData.full_name,
          tier: userData.tier || "grassroot",
          coins: userData.tier === "grassroot" ? 100 : userData.tier === "pioneer" ? 500 : 1000,
          is_verified: false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (profileError) {
          console.error("Error creating profile:", profileError)
          return { error: "Failed to create user profile" }
        }

        // Fetch the created profile
        const userProfile = await fetchUserProfile(data.user.id)
        setUser(data.user)
        setProfile(userProfile)
      }

      return {}
    } catch (error) {
      console.error("Sign up error:", error)
      return { error: "An unexpected error occurred" }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
        throw error
      }

      setUser(null)
      setProfile(null)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) {
      return { error: "No user logged in" }
    }

    try {
      const { error } = await supabase
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("auth_user_id", user.id)

      if (error) {
        console.error("Error updating profile:", error)
        return { error: error.message }
      }

      // Update local state
      setProfile((prev) => (prev ? { ...prev, ...updates } : null))
      return {}
    } catch (error) {
      console.error("Error in updateProfile:", error)
      return { error: "An unexpected error occurred" }
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshSession,
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
