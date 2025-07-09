"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient, authLogger } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { toast } from "sonner"

interface UserProfile {
  id: string
  username: string
  full_name: string
  email: string
  avatar_url?: string
  tier: "admin" | "mod" | "elder" | "blood" | "pioneer" | "grassroot"
  level: number
  points: number
  coins: number
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
  isInitialized: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, userData: any) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/* ------------------------------------------------------------------ */
/* Auth Context Logging                                               */
/* ------------------------------------------------------------------ */

const LOG_PREFIX = "[Auth Context]"

function logAuthContext(event: string, details?: any) {
  const timestamp = new Date().toISOString()
  console.log(`${LOG_PREFIX} ${timestamp} - ${event}`, details ? JSON.stringify(details, null, 2) : "")
}

function logAuthError(context: string, error: any) {
  const timestamp = new Date().toISOString()
  console.error(`${LOG_PREFIX} ${timestamp} - ERROR in ${context}:`, error)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  const supabase = createClient()

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    logAuthContext("Fetching user profile", { userId })

    try {
      const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).single()

      if (error) {
        logAuthError("Profile fetch", error)

        // Return a default profile for demo purposes
        const defaultProfile = {
          id: userId,
          username: user?.email?.split("@")[0] || "user",
          full_name: user?.user_metadata?.full_name || user?.email || "User",
          email: user?.email || "",
          avatar_url: user?.user_metadata?.avatar_url,
          tier: "grassroot" as const,
          level: 1,
          points: 0,
          coins: 1000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        logAuthContext("Using default profile", defaultProfile)
        return defaultProfile
      }

      logAuthContext("Profile fetched successfully", {
        userId,
        username: data.username,
        tier: data.tier,
        level: data.level,
      })

      return data
    } catch (error) {
      logAuthError("Profile fetch exception", error)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      logAuthContext("Refreshing profile", { userId: user.id })
      const userProfile = await fetchUserProfile(user.id)
      setProfile(userProfile)

      if (userProfile) {
        await authLogger.logUserProfile(user.id)
      }
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id) {
      logAuthError("Profile update", "No user ID available")
      return
    }

    logAuthContext("Updating profile", { userId: user.id, updates })

    try {
      const { error } = await supabase.from("users").update(updates).eq("auth_user_id", user.id)

      if (error) throw error

      setProfile((prev) => (prev ? { ...prev, ...updates } : null))
      toast.success("Profile updated successfully")

      logAuthContext("Profile updated successfully", { userId: user.id, updates })
    } catch (error) {
      logAuthError("Profile update", error)
      toast.error("Failed to update profile")
    }
  }

  const signIn = async (email: string, password: string) => {
    logAuthContext("Sign in attempt", { email })

    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        logAuthError("Sign in", error)
        authLogger.logAuthAction("signIn", false, { email, error: error.message })
        return { error: error.message }
      }

      if (data.user) {
        logAuthContext("Sign in successful", { userId: data.user.id, email })
        authLogger.logAuthAction("signIn", true, { userId: data.user.id, email })

        const userProfile = await fetchUserProfile(data.user.id)
        setProfile(userProfile)
        toast.success("Signed in successfully!")
      }

      return {}
    } catch (error: any) {
      logAuthError("Sign in exception", error)
      authLogger.logAuthAction("signIn", false, { email, error: error.message })
      return { error: error.message || "Sign in failed" }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, userData: any) => {
    logAuthContext("Sign up attempt", { email, userData: { ...userData, password: "[REDACTED]" } })

    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      })

      if (error) {
        logAuthError("Sign up", error)
        authLogger.logAuthAction("signUp", false, { email, error: error.message })
        return { error: error.message }
      }

      if (data.user && !data.user.identities?.length) {
        const errorMsg = "User already exists"
        logAuthError("Sign up", errorMsg)
        authLogger.logAuthAction("signUp", false, { email, error: errorMsg })
        return { error: errorMsg }
      }

      if (data.user) {
        logAuthContext("Sign up successful", { userId: data.user.id, email })
        authLogger.logAuthAction("signUp", true, { userId: data.user.id, email })

        try {
          const tier = userData.tier || "grassroot"
          const coins = tier === "grassroot" ? 100 : tier === "pioneer" ? 500 : 1000

          const profileData = {
            auth_user_id: data.user.id,
            email: email,
            username: userData.username,
            full_name: userData.full_name,
            tier: tier,
            coins: coins,
            level: 1,
            points: 0,
          }

          logAuthContext("Creating user profile", profileData)

          const { error: profileError } = await supabase.from("users").insert(profileData)

          if (profileError) {
            logAuthError("Profile creation", profileError)
          } else {
            logAuthContext("Profile created successfully", { userId: data.user.id })
          }
        } catch (profileError) {
          logAuthError("Profile creation exception", profileError)
        }
      }

      toast.success("Account created successfully!")
      return {}
    } catch (error: any) {
      logAuthError("Sign up exception", error)
      authLogger.logAuthAction("signUp", false, { email, error: error.message })
      return { error: error.message || "Sign up failed" }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    logAuthContext("Sign out attempt", { userId: user?.id })

    try {
      setLoading(true)
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)

      logAuthContext("Sign out successful")
      authLogger.logAuthAction("signOut", true)
      toast.success("Signed out successfully")
    } catch (error) {
      logAuthError("Sign out", error)
      authLogger.logAuthAction("signOut", false, { error })
      toast.error("Error signing out")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      logAuthContext("Initializing auth context")

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (mounted) {
          if (session?.user) {
            logAuthContext("Initial session found", {
              userId: session.user.id,
              email: session.user.email,
            })

            setUser(session.user)
            const userProfile = await fetchUserProfile(session.user.id)
            setProfile(userProfile)

            await authLogger.logUserProfile(session.user.id)
          } else {
            logAuthContext("No initial session found")
          }

          setIsInitialized(true)
          setLoading(false)

          logAuthContext("Auth context initialized", {
            hasUser: !!session?.user,
            isInitialized: true,
          })
        }
      } catch (error) {
        logAuthError("Auth initialization", error)
        if (mounted) {
          setIsInitialized(true)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      logAuthContext("Auth state change detected", {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
      })

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        const userProfile = await fetchUserProfile(session.user.id)
        setProfile(userProfile)

        await authLogger.logUserProfile(session.user.id)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        logAuthContext("Token refreshed", { userId: session.user.id })
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
      logAuthContext("Auth context cleanup")
    }
  }, [])

  const value: AuthContextType = {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isInitialized,
    signIn,
    signUp,
    signOut,
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
