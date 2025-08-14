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

  const supabase = createClient()

  const fetchProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      try {
        if (!supabase) {
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
    [supabase, profileCache],
  )

  const refreshProfile = useCallback(async () => {
    if (user) {
      setProfileCache((prev) => {
        const newCache = { ...prev }
        delete newCache[user.id]
        return newCache
      })
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }, [user, fetchProfile])

  const refreshSession = useCallback(async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

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
  }, [supabase, fetchProfile])

  const handleAuthStateChange = useCallback(
    async (event: string, session: Session | null) => {
      console.log("Auth state change:", event, session?.user?.email)

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
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
    [fetchProfile, router, initialized],
  )

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth, handleAuthStateChange])

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
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
    [supabase.auth],
  )

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      userData: { username: string; full_name: string; tier?: string; payment_reference?: string },
    ) => {
      try {
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
    [supabase.auth, router],
  )

  const signOut = useCallback(async () => {
    try {
      setLoading(true)

      setUser(null)
      setSession(null)
      setProfile(null)

      if (supabase) {
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
  }, [supabase, router])

  const resetPassword = useCallback(
    async (email: string) => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        return { error }
      } catch (error: any) {
        return { error: { message: error.message || "An unexpected error occurred" } }
      }
    },
    [supabase.auth],
  )

  const updatePassword = useCallback(
    async (password: string) => {
      try {
        const { error } = await supabase.auth.updateUser({
          password: password,
        })
        return { error }
      } catch (error: any) {
        return { error: { message: error.message || "An unexpected error occurred" } }
      }
    },
    [supabase.auth],
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
