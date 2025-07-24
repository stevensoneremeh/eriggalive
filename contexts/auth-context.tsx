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
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string, fullName?: string) => Promise<void>
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
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        if (error) {
          console.error("Error getting session:", error)
          return
        }

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
      const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).single()

      if (error) {
        console.error("Error fetching profile:", error)
        return
      }

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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, username: string, fullName?: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName || "",
          },
        },
      })

      if (error) throw error
    } catch (error) {
      console.error("Sign up error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error("Sign out error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
    } catch (error) {
      console.error("Reset password error:", error)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return

    try {
      const { error } = await supabase.from("users").update(updates).eq("auth_user_id", user.id)

      if (error) throw error

      setProfile({ ...profile, ...updates })
    } catch (error) {
      console.error("Update profile error:", error)
      throw error
    }
  }

  const refreshProfile = async () => {
    if (!user) return
    await fetchUserProfile(user.id)
  }

  const value: AuthContextType = {
    user,
    profile,
    isAuthenticated: !!user,
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
