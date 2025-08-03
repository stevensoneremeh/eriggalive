"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type { User } from "@/types/database"
import { toast } from "@/hooks/use-toast"

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (
    email: string,
    password: string,
    userData: { username: string; full_name: string },
  ) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile from database
  const fetchUserProfile = async (authUser: SupabaseUser): Promise<User | null> => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", authUser.id).single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching user profile:", error)
        return null
      }

      if (!data) {
        // Create user profile if it doesn't exist
        const newUser = {
          auth_user_id: authUser.id,
          email: authUser.email || "",
          username: authUser.user_metadata?.username || authUser.email?.split("@")[0] || "user",
          full_name: authUser.user_metadata?.full_name || "",
          tier: "grassroot" as const,
          role: "user" as const,
          coins: 100,
          level: 1,
          points: 0,
          is_verified: false,
          is_active: true,
          is_banned: false,
          login_count: 1,
          email_verified: !!authUser.email_confirmed_at,
          phone_verified: false,
          two_factor_enabled: false,
          preferences: {},
          metadata: {},
        }

        const { data: createdUser, error: createError } = await supabase.from("users").insert(newUser).select().single()

        if (createError) {
          console.error("Error creating user profile:", createError)
          return null
        }

        return createdUser
      }

      return data
    } catch (error) {
      console.error("Error in fetchUserProfile:", error)
      return null
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setSupabaseUser(session.user)
          const userProfile = await fetchUserProfile(session.user)
          setUser(userProfile)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user)
        const userProfile = await fetchUserProfile(session.user)
        setUser(userProfile)
      } else {
        setSupabaseUser(null)
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        const userProfile = await fetchUserProfile(data.user)
        setUser(userProfile)
        setSupabaseUser(data.user)

        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        })
      }

      return { success: true }
    } catch (error) {
      console.error("Sign in error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const signUp = async (email: string, password: string, userData: { username: string; full_name: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        })
      }

      return { success: true }
    } catch (error) {
      console.error("Sign up error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSupabaseUser(null)

      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      })
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Reset password error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!user) {
        return { success: false, error: "No user logged in" }
      }

      const { data, error } = await supabase.from("users").update(updates).eq("id", user.id).select().single()

      if (error) {
        return { success: false, error: error.message }
      }

      setUser(data)
      return { success: true }
    } catch (error) {
      console.error("Update profile error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const value = {
    user,
    supabaseUser,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
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
