"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Profile {
  id: number
  auth_user_id: string
  username: string
  full_name: string | null
  email: string
  avatar_url: string | null
  tier: "grassroot" | "pioneer" | "elder" | "blood"
  role: "user" | "moderator" | "admin"
  level: number
  points: number
  coins: number
  bio: string | null
  location: string | null
  is_verified: boolean
  is_active: boolean
  is_banned: boolean
  email_verified: boolean
  phone_verified: boolean
  two_factor_enabled: boolean
  login_count: number
  preferences: Record<string, any>
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
  isConfigured: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(false)
  const router = useRouter()

  const supabase = createClient()

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).single()

      if (error && error.code === "PGRST116") {
        // Profile doesn't exist, create one
        const newProfile = {
          auth_user_id: userId,
          username: user?.email?.split("@")[0] || "user",
          full_name: user?.user_metadata?.full_name || null,
          email: user?.email || "",
          tier: "grassroot" as const,
          role: "user" as const,
          level: 1,
          points: 0,
          coins: 500,
          is_verified: false,
          is_active: true,
          is_banned: false,
          email_verified: !!user?.email_confirmed_at,
          phone_verified: false,
          two_factor_enabled: false,
          login_count: 1,
          preferences: {},
          metadata: {},
        }

        const { data: createdProfile, error: createError } = await supabase
          .from("users")
          .insert(newProfile)
          .select()
          .single()

        if (!createError && createdProfile) {
          setProfile(createdProfile)
        }
      } else if (!error && data) {
        setProfile(data)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    // Check if Supabase is properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    setIsConfigured(!!(supabaseUrl && supabaseAnonKey))

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("⚠️ Supabase environment variables not configured")
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
        } else {
          setSession(session)
          setUser(session?.user ?? null)

          if (session?.user) {
            await fetchProfile(session.user.id)
          }
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
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }

      setLoading(false)

      // Handle auth events
      if (event === "SIGNED_IN") {
        // Check for redirect URL
        const redirectTo = new URLSearchParams(window.location.search).get("redirectTo")
        if (redirectTo) {
          router.push(redirectTo)
        } else {
          router.push("/dashboard")
        }
      } else if (event === "SIGNED_OUT") {
        router.push("/")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase.auth])

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: { message: "Supabase not configured" } }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signUp = async (email: string, password: string, userData?: any) => {
    if (!isConfigured) {
      return { error: { message: "Supabase not configured" } }
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    if (!isConfigured) {
      return
    }

    try {
      await supabase.auth.signOut()
      setProfile(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const resetPassword = async (email: string) => {
    if (!isConfigured) {
      return { error: { message: "Supabase not configured" } }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshProfile,
    isConfigured,
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
