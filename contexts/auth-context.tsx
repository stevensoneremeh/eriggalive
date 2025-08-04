"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Profile {
  id?: number
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
  created_at?: string
  updated_at?: string
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

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).single()

      if (error && error.code === "PGRST116") {
        // Profile doesn't exist, create one
        const username = userEmail?.split("@")[0] || `user_${Date.now()}`

        const newProfile = {
          auth_user_id: userId,
          username: username,
          full_name: user?.user_metadata?.full_name || null,
          email: userEmail || "",
          tier: "grassroot" as const,
          role: "user" as const,
          level: 1,
          points: 0,
          coins: 500,
          is_verified: false,
          is_active: true,
          is_banned: false,
          email_verified: true, // Set to true to skip email verification
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
          console.log("Profile created successfully:", createdProfile)
        } else {
          console.error("Error creating profile:", createError)
          // If creation fails due to missing columns, create a minimal profile
          if (createError?.message?.includes("column") && createError?.message?.includes("does not exist")) {
            console.log("Attempting to create minimal profile due to missing columns...")
            const minimalProfile = {
              auth_user_id: userId,
              username: username,
              full_name: user?.user_metadata?.full_name || null,
              email: userEmail || "",
            }
            
            const { data: minimalCreated, error: minimalError } = await supabase
              .from("users")
              .insert(minimalProfile)
              .select()
              .single()
              
            if (!minimalError && minimalCreated) {
              setProfile(minimalCreated)
              console.log("Minimal profile created successfully:", minimalCreated)
            }
          }
        }
      } else if (!error && data) {
        setProfile(data)
        console.log("Profile fetched successfully:", data)
      } else if (error) {
        console.error("Error fetching profile:", error)
        // If error is due to missing columns, still try to fetch basic profile
        if (error.message?.includes("column") && error.message?.includes("does not exist")) {
          console.log("Attempting to fetch basic profile due to missing columns...")
          const { data: basicData, error: basicError } = await supabase
            .from("users")
            .select("id, auth_user_id, username, full_name, email, tier, role, level, points, coins, is_verified, is_active, is_banned, created_at, updated_at")
            .eq("auth_user_id", userId)
            .single()
            
          if (!basicError && basicData) {
            // Add default values for missing columns
            const profileWithDefaults = {
              ...basicData,
              email_verified: true,
              phone_verified: false,
              two_factor_enabled: false,
              login_count: 1,
              preferences: {},
              metadata: {},
            }
            setProfile(profileWithDefaults)
            console.log("Basic profile fetched with defaults:", profileWithDefaults)
          }
        }
      }
    } catch (error) {
      console.error("Error in fetchProfile:", error)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email || undefined)
    }
  }

  useEffect(() => {
    // Check if Supabase is properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const configured = !!(supabaseUrl && supabaseAnonKey)
    setIsConfigured(configured)

    if (!configured) {
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
            await fetchProfile(session.user.id, session.user.email || undefined)
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
        await fetchProfile(session.user.id, session.user.email || undefined)
      } else {
        setProfile(null)
      }

      setLoading(false)

      // Handle auth events with proper routing
      if (event === "SIGNED_IN" && session?.user) {
        const redirectTo = new URLSearchParams(window.location.search).get("redirectTo")
        const targetPath = redirectTo || "/dashboard"

        // Only redirect if we're not already on the target path
        if (window.location.pathname !== targetPath) {
          router.push(targetPath)
        }
      } else if (event === "SIGNED_OUT") {
        // Only redirect to home if we're on a protected route
        const currentPath = window.location.pathname
        const protectedRoutes = ["/dashboard", "/profile", "/settings", "/community", "/coins", "/vault", "/premium"]

        if (protectedRoutes.some((route) => currentPath.startsWith(route))) {
          router.push("/")
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase.auth, user])

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: { message: "Supabase not configured" } }
    }

    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, userData?: any) => {
    if (!isConfigured) {
      return { error: { message: "Supabase not configured" } }
    }

    try {
      setLoading(true)
      // Sign up without email confirmation
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: undefined, // Remove email confirmation
        },
      })
      return { error }
    } catch (error) {
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!isConfigured) {
      return
    }

    try {
      setLoading(true)
      await supabase.auth.signOut()
      setProfile(null)
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setLoading(false)
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
    isAuthenticated: !!user && !!session,
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
