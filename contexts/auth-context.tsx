"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface UserProfile {
  id: number
  auth_user_id: string
  username: string
  full_name?: string
  email: string
  tier: string
  coins_balance: number
  avatar_url?: string
  level: number
  points: number
  reputation_score: number
  role: string
  is_active: boolean
  is_verified: boolean
  is_banned: boolean
  last_seen?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  refreshSession: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const hasShownWelcomeToast = useRef(false)

  // Initialize supabase client
  const supabase = createClient()

  const fetchUserProfile = async (userId: string) => {
    try {
      if (!supabase) {
        console.error("Supabase client not initialized")
        return null
      }

      const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).single()

      if (error) {
        console.error("Error fetching user profile:", error)
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error("Error in fetchUserProfile:", error)
      return null
    }
  }

  const refreshProfile = async () => {
    if (!user?.id) return

    try {
      const profileData = await fetchUserProfile(user.id)
      setProfile(profileData)
    } catch (error) {
      console.error("Error refreshing profile:", error)
    }
  }

  const refreshSession = async () => {
    try {
      if (!supabase?.auth) {
        console.error("Supabase auth not available")
        return
      }

      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error("Error refreshing session:", error)
      } else if (data.session) {
        setSession(data.session)
        setUser(data.session.user)
        await refreshProfile()
      }
    } catch (error) {
      console.error("Error in refreshSession:", error)
    }
  }

  useEffect(() => {
    if (!supabase?.auth) {
      console.error("Supabase auth not available")
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
        }

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const profileData = await fetchUserProfile(session.user.id)
          setProfile(profileData)
          hasShownWelcomeToast.current = true
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
      console.log("Auth state changed:", event, session?.user?.email)
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const profileData = await fetchUserProfile(session.user.id)
        setProfile(profileData)
      } else {
        setProfile(null)
      }

      setLoading(false)

      // Handle redirects based on auth state
      if (event === "SIGNED_IN" && session && !hasShownWelcomeToast.current) {
        hasShownWelcomeToast.current = true
        const redirectTo = localStorage.getItem("redirectAfterAuth") || "/dashboard"
        localStorage.removeItem("redirectAfterAuth")
        router.push(redirectTo)
        toast.success("Welcome back!")
      } else if (event === "SIGNED_OUT") {
        hasShownWelcomeToast.current = false
        router.push("/")
        toast.success("Signed out successfully")
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const signUp = async (email: string, password: string) => {
    try {
      if (!supabase?.auth) {
        throw new Error("Authentication not available")
      }

      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        console.error("Signup error:", error)
        toast.error(error.message || "Failed to create account")
        return { error }
      }

      toast.success("Account created successfully! Please check your email to verify your account.")
      return { error: null }
    } catch (error) {
      console.error("Signup error:", error)
      toast.error("An unexpected error occurred")
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      if (!supabase?.auth) {
        throw new Error("Authentication not available")
      }

      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Signin error:", error)
        toast.error(error.message || "Failed to sign in")
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error("Signin error:", error)
      toast.error("An unexpected error occurred")
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      if (!supabase?.auth) {
        throw new Error("Authentication not available")
      }

      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Signout error:", error)
        toast.error("Failed to sign out")
        throw error
      }
    } catch (error) {
      console.error("Signout error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      if (!supabase?.auth) {
        throw new Error("Authentication not available")
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        console.error("Reset password error:", error)
        toast.error(error.message || "Failed to send reset email")
        return { error }
      }

      toast.success("Password reset email sent!")
      return { error: null }
    } catch (error) {
      console.error("Reset password error:", error)
      toast.error("An unexpected error occurred")
      return { error }
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    resetPassword,
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
