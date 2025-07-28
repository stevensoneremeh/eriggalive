"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface UserProfile {
  id: number
  auth_user_id: string
  username: string
  display_name?: string
  full_name?: string
  email: string
  subscription_tier: string
  coins_balance: number
  avatar_url?: string
  bio?: string
  location?: string
  website?: string
  total_posts: number
  total_votes_received: number
  total_comments: number
  is_verified: boolean
  is_active: boolean
  last_seen_at?: string
  created_at: string
  updated_at: string
}

interface SignUpData {
  username: string
  full_name: string
  tier: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string, userData: SignUpData) => Promise<{ error: any }>
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
  const initializationComplete = useRef(false)

  // Initialize supabase client once
  const supabase = createClient()

  const createUserProfile = useCallback(
    async (authUser: User, userData: SignUpData) => {
      try {
        if (!supabase) {
          console.error("Supabase client not available")
          return null
        }

        // Check if supabase.from exists and has the expected methods
        if (!supabase.from || typeof supabase.from !== "function") {
          console.warn("Supabase client missing 'from' method, using mock data")
          return {
            id: 1,
            auth_user_id: authUser.id,
            username: userData.username,
            display_name: userData.username,
            full_name: userData.full_name,
            email: authUser.email || "",
            subscription_tier: userData.tier,
            coins_balance: userData.tier === "grassroot" ? 100 : userData.tier === "pioneer" ? 500 : 1000,
            total_posts: 0,
            total_votes_received: 0,
            total_comments: 0,
            is_verified: false,
            is_active: true,
            last_seen_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as UserProfile
        }

        const { data, error } = await supabase
          .from("users")
          .insert({
            auth_user_id: authUser.id,
            username: userData.username,
            display_name: userData.username,
            full_name: userData.full_name,
            email: authUser.email || "",
            subscription_tier: userData.tier,
            coins_balance: userData.tier === "grassroot" ? 100 : userData.tier === "pioneer" ? 500 : 1000,
            total_posts: 0,
            total_votes_received: 0,
            total_comments: 0,
            is_verified: false,
            is_active: true,
            last_seen_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          console.error("Error creating user profile:", error)
          return null
        }

        return data as UserProfile
      } catch (error) {
        console.error("Error in createUserProfile:", error)
        return null
      }
    },
    [supabase],
  )

  const fetchUserProfile = useCallback(
    async (userId: string) => {
      try {
        if (!supabase) {
          console.error("Supabase client not initialized")
          return null
        }

        // Check if supabase.from exists and has the expected methods
        if (!supabase.from || typeof supabase.from !== "function") {
          console.warn("Supabase client missing 'from' method, using mock data")
          return {
            id: 1,
            auth_user_id: userId,
            username: "testuser",
            display_name: "Test User",
            full_name: "Test User",
            email: "test@example.com",
            subscription_tier: "general",
            coins_balance: 1000,
            total_posts: 0,
            total_votes_received: 0,
            total_comments: 0,
            is_verified: false,
            is_active: true,
            last_seen_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as UserProfile
        }

        const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).single()

        if (error) {
          console.error("Error fetching user profile:", error)
          return null
        }

        // Update last seen in a separate try-catch to avoid blocking profile fetch
        try {
          const updateQuery = supabase.from("users").update({ last_seen_at: new Date().toISOString() })
          if (updateQuery && typeof updateQuery.eq === "function") {
            await updateQuery.eq("auth_user_id", userId)
          }
        } catch (updateError) {
          console.warn("Could not update last_seen_at:", updateError)
          // Don't throw here, just log the warning
        }

        return data as UserProfile
      } catch (error) {
        console.error("Error in fetchUserProfile:", error)
        return null
      }
    },
    [supabase],
  )

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return

    try {
      const profileData = await fetchUserProfile(user.id)
      setProfile(profileData)
    } catch (error) {
      console.error("Error refreshing profile:", error)
    }
  }, [user?.id, fetchUserProfile])

  const refreshSession = useCallback(async () => {
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
        if (data.session.user) {
          const profileData = await fetchUserProfile(data.session.user.id)
          setProfile(profileData)
        }
      }
    } catch (error) {
      console.error("Error in refreshSession:", error)
    }
  }, [supabase, fetchUserProfile])

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
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error)
      } finally {
        setLoading(false)
        initializationComplete.current = true
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)

      // Don't process events during initial load
      if (!initializationComplete.current) {
        return
      }

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const profileData = await fetchUserProfile(session.user.id)
        setProfile(profileData)
      } else {
        setProfile(null)
      }

      setLoading(false)

      // Handle redirects based on auth state with improved logic
      if (event === "SIGNED_IN" && session && !hasShownWelcomeToast.current) {
        hasShownWelcomeToast.current = true
        const redirectTo = sessionStorage.getItem("redirectAfterAuth") || "/dashboard"
        sessionStorage.removeItem("redirectAfterAuth")

        // Only redirect if not already on the target page
        if (window.location.pathname !== redirectTo) {
          router.push(redirectTo)
        }

        toast.success("Welcome back!")
      } else if (event === "SIGNED_OUT") {
        hasShownWelcomeToast.current = false
        // Only redirect to home if user is on a protected page
        const currentPath = window.location.pathname
        const protectedPaths = ["/dashboard", "/vault", "/coins", "/profile", "/meet-greet", "/admin", "/premium"]

        if (protectedPaths.some((path) => currentPath.startsWith(path))) {
          router.push("/")
        }

        toast.success("Signed out successfully")
      }
    })

    return () => subscription.unsubscribe()
  }, [router, fetchUserProfile])

  const signUp = async (email: string, password: string, userData: SignUpData) => {
    try {
      if (!supabase?.auth) {
        throw new Error("Authentication not available")
      }

      setLoading(true)

      // Check if username is already taken (with fallback for mock client)
      try {
        if (supabase.from && typeof supabase.from === "function") {
          const { data: existingUser, error: checkError } = await supabase
            .from("users")
            .select("username")
            .eq("username", userData.username)
            .single()

          if (checkError && checkError.code !== "PGRST116") {
            // PGRST116 is "not found" which is what we want
            console.error("Error checking username:", checkError)
            return { error: checkError }
          }

          if (existingUser) {
            return { error: { message: "Username is already taken" } }
          }
        }
      } catch (checkError) {
        console.warn("Could not check username uniqueness:", checkError)
        // Continue with signup anyway
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            username: userData.username,
            full_name: userData.full_name,
            tier: userData.tier,
          },
        },
      })

      if (error) {
        console.error("Signup error:", error)
        toast.error(error.message || "Failed to create account")
        return { error }
      }

      if (data.user) {
        // Create user profile
        const profileData = await createUserProfile(data.user, userData)
        if (profileData) {
          setProfile(profileData)
        }
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
    isAuthenticated: !!user && !!session,
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
