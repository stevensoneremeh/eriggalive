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
  phone: string | null
  avatar_url: string | null
  tier: "grassroot" | "pioneer" | "elder" | "blood"
  role: "user" | "moderator" | "admin"
  coins_balance: number
  referral_code: string | null
  created_at?: string
  updated_at?: string
  last_login?: string
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
      console.log("🔍 Fetching profile for user:", userId)

      const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).single()

      if (error && error.code === "PGRST116") {
        // Profile doesn't exist, create one
        console.log("👤 Creating new profile for user:", userEmail)

        const username = userEmail?.split("@")[0] || `user_${Date.now()}`
        const newProfile = {
          auth_user_id: userId,
          username: username,
          full_name: user?.user_metadata?.full_name || null,
          email: userEmail || "",
          phone: null,
          avatar_url: null,
          tier: "grassroot" as const,
          role: "user" as const,
          coins_balance: 500,
          referral_code: null,
        }

        const { data: createdProfile, error: createError } = await supabase
          .from("users")
          .insert(newProfile)
          .select()
          .single()

        if (!createError && createdProfile) {
          setProfile(createdProfile)
          console.log("✅ Profile created successfully:", createdProfile.username)
        } else {
          console.error("❌ Error creating profile:", createError)
          // Set a minimal profile to allow access
          setProfile({
            auth_user_id: userId,
            username: username,
            full_name: user?.user_metadata?.full_name || null,
            email: userEmail || "",
            phone: null,
            avatar_url: null,
            tier: "grassroot" as const,
            role: "user" as const,
            coins_balance: 500,
            referral_code: null,
          })
        }
      } else if (!error && data) {
        setProfile(data)
        console.log("✅ Profile loaded:", data.username)
      } else if (error) {
        console.error("❌ Error fetching profile:", error)
        // Set a fallback profile to prevent blocking access
        setProfile({
          auth_user_id: userId,
          username: userEmail?.split("@")[0] || "user",
          full_name: user?.user_metadata?.full_name || null,
          email: userEmail || "",
          phone: null,
          avatar_url: null,
          tier: "grassroot" as const,
          role: "user" as const,
          coins_balance: 500,
          referral_code: null,
        })
      }
    } catch (error) {
      console.error("❌ Unexpected error in fetchProfile:", error)
      // Always set a fallback profile to prevent blocking
      setProfile({
        auth_user_id: userId,
        username: userEmail?.split("@")[0] || "user",
        full_name: user?.user_metadata?.full_name || null,
        email: userEmail || "",
        phone: null,
        avatar_url: null,
        tier: "grassroot" as const,
        role: "user" as const,
        coins_balance: 500,
        referral_code: null,
      })
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
          console.error("❌ Error getting session:", error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)

          if (session?.user) {
            await fetchProfile(session.user.id, session.user.email || undefined)
          }
        }
      } catch (error) {
        console.error("❌ Error in getInitialSession:", error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state changed:", event, session?.user?.email)

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email || undefined)
      } else {
        setProfile(null)
      }

      setLoading(false)

      // Handle auth events
      if (event === "SIGNED_IN" && session?.user) {
        console.log("✅ User signed in, allowing dashboard access")
        // Don't force redirect here, let the user navigate naturally
      } else if (event === "SIGNED_OUT") {
        console.log("👋 User signed out")
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
      console.log("🔐 Attempting to sign in:", email)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error) {
        console.log("✅ Sign in successful")
      }

      return { error }
    } catch (error) {
      console.error("❌ Sign in error:", error)
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
      console.log("📝 Attempting to sign up:", email)

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: undefined,
        },
      })

      if (!error) {
        console.log("✅ Sign up successful")
      }

      return { error }
    } catch (error) {
      console.error("❌ Sign up error:", error)
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
      console.log("👋 Signing out user")

      await supabase.auth.signOut()
      setProfile(null)

      console.log("✅ Sign out successful")
    } catch (error) {
      console.error("❌ Error signing out:", error)
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    if (!isConfigured) {
      return { error: { message: "Supabase not configured" } }
    }

    try {
      console.log("🔄 Sending password reset email:", email)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (!error) {
        console.log("✅ Password reset email sent")
      }

      return { error }
    } catch (error) {
      console.error("❌ Password reset error:", error)
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
