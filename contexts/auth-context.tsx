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
  const router = useRouter()

  const [supabaseClient, setSupabaseClient] = useState<ReturnType<typeof createClient> | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const client = createClient()
      setSupabaseClient(client)
      setClientError(null)
    } catch (error: any) {
      console.error("Failed to initialize Supabase client:", error)
      setClientError(error.message)
      setLoading(false)
      setInitialized(true)
    }
  }, [])

  const fetchProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      if (!supabaseClient || clientError) {
        console.warn("Supabase client not available, skipping profile fetch")
        return null
      }

      try {
        let retries = 3
        let lastError: any = null

        while (retries > 0) {
          try {
            const { data, error } = await supabaseClient
              .from("users")
              .select("*")
              .eq("auth_user_id", userId)
              .maybeSingle()

            if (error) {
              console.error("Error fetching profile:", error.message)
              return null
            }

            return data
          } catch (error: any) {
            lastError = error
            retries--
            if (retries > 0) {
              console.warn(`Profile fetch failed, retrying... (${retries} attempts left)`)
              await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second before retry
            }
          }
        }

        throw lastError
      } catch (error: any) {
        console.error("Error in fetchProfile after retries:", error.message)
        return null
      }
    },
    [supabaseClient, clientError],
  )

  const refreshProfile = useCallback(async () => {
    if (user && supabaseClient && !clientError) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }, [user, fetchProfile, supabaseClient, clientError])

  const refreshSession = useCallback(async () => {
    if (!supabaseClient || clientError) {
      console.warn("Supabase client not available, skipping session refresh")
      return
    }

    try {
      const {
        data: { session },
        error,
      } = await supabaseClient.auth.getSession()

      if (error) {
        console.error("Error refreshing session:", error.message)
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
  }, [supabaseClient, clientError, fetchProfile])

  const handleAuthStateChange = useCallback(
    async (event: string, session: Session | null) => {
      console.log("Auth state change:", event, session?.user?.email)

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user && supabaseClient && !clientError) {
        // Fetch profile for authenticated user
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)

        if (event === "SIGNED_IN" && initialized) {
          router.push("/dashboard") // Redirect to dashboard instead of home
        }
      } else {
        setProfile(null)

        if (event === "SIGNED_OUT" && initialized) {
          router.push("/login")
        }
      }

      if (!initialized) {
        setInitialized(true)
      }
      setLoading(false)
    },
    [fetchProfile, router, initialized, supabaseClient, clientError],
  )

  useEffect(() => {
    if (!supabaseClient || clientError) {
      return
    }

    let mounted = true

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabaseClient.auth.getSession()

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

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(handleAuthStateChange)

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabaseClient, clientError, handleAuthStateChange])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabaseClient || clientError) {
        return { error: { message: "Authentication service is not available" } }
      }

      try {
        setLoading(true)

        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setLoading(false)
          return { error }
        }

        // Let auth state change handle the rest
        return { error: null }
      } catch (error: any) {
        setLoading(false)
        return { error: { message: error.message || "An unexpected error occurred" } }
      }
    },
    [supabaseClient, clientError],
  )

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      userData: { username: string; full_name: string; tier?: string; payment_reference?: string },
    ) => {
      if (!supabaseClient || clientError) {
        return { error: { message: "Authentication service is not available" } }
      }

      try {
        setLoading(true)

        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
            data: {
              username: userData.username,
              full_name: userData.full_name,
              tier: userData.tier || "free", // Updated default tier to "free"
              payment_reference: userData.payment_reference,
            },
          },
        })

        if (error) {
          setLoading(false)
          return { error }
        }

        setLoading(false)
        return { error: null }
      } catch (error: any) {
        setLoading(false)
        return { error: { message: error.message || "An unexpected error occurred" } }
      }
    },
    [supabaseClient, clientError],
  )

  const signOut = useCallback(async () => {
    if (!supabaseClient || clientError) {
      console.warn("Supabase client not available, clearing local state only")
      setUser(null)
      setSession(null)
      setProfile(null)
      router.push("/login")
      return
    }

    try {
      setLoading(true)
      const { error } = await supabaseClient.auth.signOut()

      if (error) {
        console.error("Error signing out:", error.message)
      }
    } catch (error: any) {
      console.error("Error signing out:", error.message)
    } finally {
      setLoading(false)
    }
  }, [supabaseClient, clientError, router])

  const resetPassword = useCallback(
    async (email: string) => {
      if (!supabaseClient || clientError) {
        return { error: { message: "Authentication service is not available" } }
      }

      try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        return { error }
      } catch (error: any) {
        return { error: { message: error.message || "An unexpected error occurred" } }
      }
    },
    [supabaseClient, clientError],
  )

  const updatePassword = useCallback(
    async (password: string) => {
      if (!supabaseClient || clientError) {
        return { error: { message: "Authentication service is not available" } }
      }

      try {
        const { error } = await supabaseClient.auth.updateUser({
          password: password,
        })
        return { error }
      } catch (error: any) {
        return { error: { message: error.message || "An unexpected error occurred" } }
      }
    },
    [supabaseClient, clientError],
  )

  if (clientError) {
    console.error("Supabase configuration error:", clientError)
    // Still provide the context but with limited functionality
  }

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
