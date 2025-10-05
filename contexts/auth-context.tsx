"use client"

import type React from "react"
<<<<<<< HEAD
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
=======
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User, Session } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

type UserProfile = Database["public"]["Tables"]["users"]["Row"]
>>>>>>> new

interface AuthContextType {
  user: User | null
  session: Session | null
<<<<<<< HEAD
  profile: Profile | null
  loading: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  refreshSession: () => Promise<void>
  refreshProfile: () => Promise<void>
  isConfigured: boolean
=======
  profile: UserProfile | null
  loading: boolean
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (
    email: string,
    password: string,
    userData: { username: string; full_name: string; tier?: string; payment_reference?: string },
  ) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
  refreshSession: () => Promise<void>
>>>>>>> new
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
<<<<<<< HEAD
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(false)
  const router = useRouter()

  const supabase = createClient()

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      console.log("🔍 Fetching profile for user:", userId)

      // First try to get existing profile
      const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).single()

      if (error && error.code === "PGRST116") {
        // Profile doesn't exist, but it should have been created by trigger
        // Wait a moment and try again
        console.log("⏳ Profile not found, waiting for trigger...")
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const { data: retryData, error: retryError } = await supabase
          .from("users")
          .select("*")
          .eq("auth_user_id", userId)
          .single()

        if (!retryError && retryData) {
          setProfile(retryData)
          console.log("✅ Profile found after retry:", retryData.username)
          return
        }

        // If still no profile, create a fallback one
        console.log("🔧 Creating fallback profile...")
        const username = userEmail?.split("@")[0] || `user_${Date.now()}`
        const fallbackProfile: Profile = {
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

        setProfile(fallbackProfile)
        console.log("✅ Fallback profile set:", fallbackProfile.username)
      } else if (!error && data) {
        setProfile(data)
        console.log("✅ Profile loaded:", data.username)
      } else if (error) {
        console.error("❌ Error fetching profile:", error)
        // Create fallback profile to prevent blocking
        const username = userEmail?.split("@")[0] || "user"
        const fallbackProfile: Profile = {
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
        setProfile(fallbackProfile)
        console.log("✅ Fallback profile created due to error")
      }
    } catch (error) {
      console.error("❌ Unexpected error in fetchProfile:", error)
      // Always set a fallback profile to prevent blocking
      const username = userEmail?.split("@")[0] || "user"
      const fallbackProfile: Profile = {
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
      setProfile(fallbackProfile)
      console.log("✅ Emergency fallback profile created")
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
=======
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [profileCache, setProfileCache] = useState<{ [key: string]: UserProfile }>({})
  const router = useRouter()

  const [supabaseError, setSupabaseError] = useState<string | null>(null)

  let supabase: any
  try {
    supabase = createClient()
  } catch (error: any) {
    console.error("Failed to initialize Supabase client:", error)
    setSupabaseError(error.message)
    supabase = null
  }

  const fetchProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      try {
        if (!supabase || supabaseError) {
          return null
        }

        if (profileCache[userId]) {
          return profileCache[userId]
        }

        // Add timeout wrapper for database requests
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Profile fetch timeout")), 3000)
        })

        const fetchPromise = supabase.from("users").select("*").eq("auth_user_id", userId).maybeSingle()

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

        if (error) {
          // Don't log errors repeatedly to avoid console spam
          return null
        }

        if (data) {
          setProfileCache((prev) => ({ ...prev, [userId]: data }))
        }

        return data
      } catch (error: any) {
        // Silent failure to prevent console spam
        return null
      }
    },
    [supabase, profileCache, supabaseError],
  )

  const refreshProfile = useCallback(async () => {
    if (user && !supabaseError) {
      setProfileCache((prev) => {
        const newCache = { ...prev }
        delete newCache[user.id]
        return newCache
      })
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }, [user, fetchProfile, supabaseError])

  const refreshSession = useCallback(async () => {
    try {
      if (!supabase || supabaseError) {
        console.warn("Cannot refresh session: Running in offline mode")
        return
      }

      // Add timeout for session refresh
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Session refresh timeout")), 3000)
      })

      const refreshPromise = supabase.auth.refreshSession()
      const { data: { session }, error } = await Promise.race([refreshPromise, timeoutPromise])

      if (error) {
        console.warn("Session refresh failed, maintaining current state:", error.message)
        return
      }
>>>>>>> new

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
<<<<<<< HEAD
        await fetchProfile(session.user.id, session.user.email || undefined)
      } else {
        setProfile(null)
      }

      setLoading(false)

      // Handle auth events
      if (event === "SIGNED_IN" && session?.user) {
        console.log("✅ User signed in successfully")
        // Redirect to dashboard after successful login
        const redirectTo = new URLSearchParams(window.location.search).get("redirectTo")
        const targetPath = redirectTo || "/dashboard"

        if (window.location.pathname !== targetPath) {
          router.push(targetPath)
        }
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
      } else {
        console.error("❌ Sign in error:", error)
      }

      return { error }
    } catch (error) {
      console.error("❌ Sign in exception:", error)
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

      if (error) {
        console.error("❌ Sign up error:", error)
      } else {
        console.log("✅ User signed up successfully")
      }

      return { error }
    } catch (error) {
      console.error("❌ Sign up exception:", error)
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
=======
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)
      } else {
        setProfile(null)
      }
    } catch (error: any) {
      console.error("Error in refreshSession:", error.message)
    }
  }, [supabase, fetchProfile, supabaseError])

  const handleAuthStateChange = useCallback(
    async (event: string, session: Session | null) => {
      // Only log in development to prevent console spam
      if (process.env.NODE_ENV === 'development') {
        console.log("Auth state change:", event, session?.user?.email)
      }

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user && !supabaseError) {
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)

        if (event === "SIGNED_IN" && initialized) {
          const urlParams = new URLSearchParams(window.location.search)
          const redirectTo = urlParams.get("redirect")

          if (redirectTo && redirectTo.startsWith("/")) {
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete("redirect")
            window.history.replaceState({}, "", newUrl.toString())
            router.push(redirectTo)
          } else {
            router.push("/dashboard")
          }
        }
      } else {
        setProfile(null)
        setProfileCache({})

        if (event === "SIGNED_OUT" && initialized) {
          router.push("/")
        }
      }

      if (!initialized) {
        setInitialized(true)
      }
      setLoading(false)
    },
    [fetchProfile, router, initialized, supabaseError],
  )

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        if (!supabase || supabaseError) {
          console.warn("Skipping auth initialization: Supabase not available")
          if (mounted) {
            setLoading(false)
            setInitialized(true)
          }
          return
        }

        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error.message)
        }

        if (mounted) {
          await handleAuthStateChange("INITIAL_SESSION", initialSession)
        }
      } catch (error: any) {
        console.error("Error initializing auth:", error.message)
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    let subscription: any
    if (supabase && !supabaseError) {
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange(handleAuthStateChange)
      subscription = authSubscription
    }

    // Set up session refresh interval (every 10 minutes instead of 50)
    const refreshInterval = setInterval(
      async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession()

          if (error) {
            console.error('[Auth] Session refresh error:', error)
          } else if (data.session) {
            setSession(data.session)
            setUser(data.session.user)
          }
        } catch (err) {
          console.error('[Auth] Session refresh failed:', err)
        }
      },
      10 * 60 * 1000, // 10 minutes
    )

    return () => {
      mounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
      clearInterval(refreshInterval)
    }
  }, [supabase, handleAuthStateChange, supabaseError, user, refreshSession])

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        if (!supabase || supabaseError) {
          return { error: { message: "Authentication service not available" } }
        }

        setLoading(true)
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setLoading(false)
          return { error }
        }

        return { error: null }
      } catch (error: any) {
        setLoading(false)
        return { error: { message: error.message || "An unexpected error occurred" } }
      }
    },
    [supabase, supabaseError],
  )

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      userData: { username: string; full_name: string; tier?: string; payment_reference?: string; custom_amount?: string },
    ) => {
      try {
        if (!supabase || supabaseError) {
          return { error: { message: "Authentication service not available" } }
        }

        setLoading(true)

        // Validate required fields
        if (!email || !password || !userData.username || !userData.full_name) {
          setLoading(false)
          return { error: { message: "All required fields must be provided" } }
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: userData.username,
              full_name: userData.full_name,
              tier: userData.tier || "FREE",
              payment_reference: userData.payment_reference,
              custom_amount: userData.custom_amount,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/dashboard`,
          },
        })

        if (error) {
          console.error('Supabase signup error:', error)
          setLoading(false)
          return { error: { message: error.message || "Failed to create account" } }
        }

        if (data.user && !data.user.email_confirmed_at) {
          router.push("/signup/success")
        } else if (data.user) {
          router.push("/dashboard")
        }

        setLoading(false)
        return { error: null }
      } catch (error: any) {
        console.error('Signup error:', error)
        setLoading(false)
        return { error: { message: error.message || "An unexpected error occurred during signup" } }
      }
    },
    [supabase, router, supabaseError],
  )

  const signOut = useCallback(async () => {
    try {
      setLoading(true)

      setUser(null)
      setSession(null)
      setProfile(null)

      if (supabase && !supabaseError) {
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error("Error signing out:", error.message)
        }
      }

      router.push("/")
    } catch (error: any) {
      console.error("Error signing out:", error.message)
    } finally {
      setLoading(false)
    }
  }, [supabase, router, supabaseError])

  const resetPassword = useCallback(
    async (email: string) => {
      try {
        if (!supabase || supabaseError) {
          return { error: { message: "Authentication service not available" } }
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        return { error }
      } catch (error: any) {
        return { error: { message: error.message || "An unexpected error occurred" } }
      }
    },
    [supabase, supabaseError],
  )

  const updatePassword = useCallback(
    async (password: string) => {
      try {
        if (!supabase || supabaseError) {
          return { error: { message: "Authentication service not available" } }
        }

        const { error } = await supabase.auth.updateUser({
          password: password,
        })
        return { error }
      } catch (error: any) {
        return { error: { message: error.message || "An unexpected error occurred" } }
      }
    },
    [supabase, supabaseError],
  )
>>>>>>> new

  const value = {
    user,
    session,
    profile,
    loading,
<<<<<<< HEAD
    isAuthenticated: !!user && !!session,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshProfile,
    isConfigured,
=======
    isLoading: loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
    refreshSession,
>>>>>>> new
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
<<<<<<< HEAD
}
=======
}
>>>>>>> new
