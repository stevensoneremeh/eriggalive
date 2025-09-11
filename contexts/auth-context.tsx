"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User, Session } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

type UserProfile = Database["public"]["Tables"]["users"]["Row"]

interface AuthContextType {
  user: User | null
  session: Session | null
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
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
          console.warn("Supabase client not available")
          return null
        }

        if (profileCache[userId]) {
          return profileCache[userId]
        }

        const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).maybeSingle()

        if (error) {
          console.error("Error fetching profile:", error.message)
          return null
        }

        if (data) {
          setProfileCache((prev) => ({ ...prev, [userId]: data }))
        }

        return data
      } catch (error: any) {
        console.error("Error in fetchProfile:", error.message)
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
        console.warn("Cannot refresh session: Supabase not available")
        return
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession()

      if (error) {
        console.error("Error refreshing session:", error.message)
        // If refresh fails, try to get current session
        const { data: currentSession } = await supabase.auth.getSession()
        setSession(currentSession.session)
        setUser(currentSession.session?.user ?? null)

        if (currentSession.session?.user) {
          const profileData = await fetchProfile(currentSession.session.user.id)
          setProfile(profileData)
        } else {
          setProfile(null)
        }
        return
      }

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
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
      console.log("Auth state change:", event, session?.user?.email)

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user && !supabaseError) {
        fetchProfile(session.user.id).then((profileData) => {
          setProfile(profileData)
        })

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

    const refreshInterval = setInterval(
      () => {
        if (user && supabase && !supabaseError) {
          refreshSession()
        }
      },
      4 * 60 * 1000,
    ) // Refresh every 4 minutes

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
      userData: { username: string; full_name: string; tier?: string; payment_reference?: string },
    ) => {
      try {
        if (!supabase || supabaseError) {
          return { error: { message: "Authentication service not available" } }
        }

        setLoading(true)
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: userData.username,
              full_name: userData.full_name,
              tier: userData.tier || "free",
              payment_reference: userData.payment_reference,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/dashboard`,
          },
        })

        if (error) {
          setLoading(false)
          return { error }
        }

        if (data.user && !data.user.email_confirmed_at) {
          router.push("/signup/success")
        } else if (data.user) {
        }

        setLoading(false)
        return { error: null }
      } catch (error: any) {
        setLoading(false)
        return { error: { message: error.message || "An unexpected error occurred" } }
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

  const value = {
    user,
    session,
    profile,
    loading,
    isLoading: loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
    refreshSession,
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
