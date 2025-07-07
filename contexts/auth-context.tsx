"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  email: string
  tier: string
  coins: number
  points: number
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  isInitialized: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, username: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from("users") // ← back to the correct table
        .select("*")
        .eq("auth_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle() // ← don’t error if 0 or >1 rows

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error)
        return null
      }

      return data as Profile | null
    } catch (error) {
      console.error("Error in fetchProfile:", error)
      return null
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return

    const profileData = await fetchProfile(user.id)
    setProfile(profileData)
  }, [user?.id, fetchProfile])

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user?.id) return

      try {
        const { error } = await supabase
          .from("users") // ← consistent table
          .update(updates)
          .eq("auth_user_id", user.id)

        if (error) throw error

        setProfile((prev) => (prev ? { ...prev, ...updates } : null))
        toast.success("Profile updated successfully")
      } catch (error) {
        console.error("Error updating profile:", error)
        toast.error("Failed to update profile")
      }
    },
    [user?.id],
  )

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true)
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          return { error: error.message }
        }

        if (data.user) {
          const profileData = await fetchProfile(data.user.id)
          setProfile(profileData)
          toast.success("Signed in successfully!")
          router.push("/dashboard")
        }

        return {}
      } catch (error) {
        console.error("Sign in error:", error)
        return { error: "An unexpected error occurred" }
      } finally {
        setLoading(false)
      }
    },
    [fetchProfile, router],
  )

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      })

      if (error) {
        return { error: error.message }
      }

      toast.success("Account created! Please check your email to verify your account.")
      return {}
    } catch (error) {
      console.error("Sign up error:", error)
      return { error: "An unexpected error occurred" }
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setSession(null)
      toast.success("Signed out successfully")
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
      toast.error("Error signing out")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (mounted) {
          setSession(initialSession)
          setUser(initialSession?.user ?? null)

          if (initialSession?.user) {
            const profileData = await fetchProfile(initialSession.user.id)
            if (mounted) {
              setProfile(profileData)
            }
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        if (mounted) {
          setLoading(false)
          setIsInitialized(true)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("Auth state changed:", event, session?.user?.id)

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id)
        if (mounted) {
          setProfile(profileData)
        }
      } else {
        setProfile(null)
      }

      if (mounted) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const value: AuthContextType = {
    user,
    profile,
    session,
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
