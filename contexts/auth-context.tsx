"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

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
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signUp: (
    email: string,
    password: string,
    metadata?: { username?: string; full_name?: string; tier?: string },
  ) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log("Getting initial session...")
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          return
        }

        console.log("Initial session:", session?.user?.id)
        if (session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user.id)
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id)

      if (session?.user) {
        setUser(session.user)
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for:", userId)
      const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).single()

      if (error) {
        console.error("Error fetching profile:", error)
        return
      }

      console.log("User profile fetched:", data?.username)
      if (data) {
        setProfile(data)
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      console.log("Signing in user:", email)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        return { error }
      }

      console.log("Sign in successful")
      return { error: null }
    } catch (error) {
      console.error("Sign in error:", error)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (
    email: string,
    password: string,
    metadata?: { username?: string; full_name?: string; tier?: string },
  ) => {
    setLoading(true)
    try {
      console.log("Signing up user:", email, metadata)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: metadata?.username || "",
            full_name: metadata?.full_name || "",
            tier: metadata?.tier || "grassroot",
          },
        },
      })

      if (error) {
        console.error("Sign up error:", error)
        return { error }
      }

      console.log("Sign up successful")
      return { error: null }
    } catch (error) {
      console.error("Sign up error:", error)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      console.log("Signing out user")
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setProfile(null)
      console.log("Sign out successful")
    } catch (error) {
      console.error("Sign out error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      console.log("Resetting password for:", email)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
      console.log("Password reset email sent")
    } catch (error) {
      console.error("Reset password error:", error)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return

    try {
      console.log("Updating profile:", updates)
      const { error } = await supabase.from("users").update(updates).eq("auth_user_id", user.id)

      if (error) throw error

      setProfile({ ...profile, ...updates })
      console.log("Profile updated successfully")
    } catch (error) {
      console.error("Update profile error:", error)
      throw error
    }
  }

  const refreshProfile = async () => {
    if (!user) return
    console.log("Refreshing profile")
    await fetchUserProfile(user.id)
  }

  const value: AuthContextType = {
    user,
    profile,
    isAuthenticated: !!user,
    isLoading: loading,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
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
