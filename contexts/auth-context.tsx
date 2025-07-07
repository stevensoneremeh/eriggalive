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
  level: number
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
  signUp: (email: string, password: string, userData: any) => Promise<{ error?: string }>
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
    if (!supabase) return null

    try {
      const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).maybeSingle()

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
      if (!user?.id || !supabase) return

      try {
        const { error } = await supabase.from("users").update(updates).eq("auth_user_id", user.id)

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
      if (!supabase) return { error: "Supabase not initialized" }

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
        }

        return {}
      } catch (error) {
        console.error("Sign in error:", error)
        return { error: "An unexpected error occurred" }
      } finally {
        setLoading(false)
      }
    },
    [fetchProfile],
  )

  const signUp = useCallback(async (email: string, password: string, userData: any) => {
    if (!supabase) return { error: "Supabase not initialized" }

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
        return { error: error.message }
      }

      // Create user profile if signup was successful
      if (data.user && !data.user.identities?.length) {
        return { error: "User already exists" }
      }

      if (data.user) {
        const tier = userData.tier || "grassroot"
        const coins = tier === "grassroot" ? 100 : tier === "pioneer" ? 500 : 1000

        const { error: profileError } = await supabase.from("users").insert({
          auth_user_id: data.user.id,
          email: email,
          username: userData.username,
          full_name: userData.full_name,
          tier: tier as any,
          coins: coins,
          level: 1,
          points: 0,
        })

        if (profileError) {
          console.error("Error creating profile:", profileError)
        }
      }

      toast.success("Account created successfully!")
      return {}
    } catch (error) {
      console.error("Sign up error:", error)
      return { error: "An unexpected error occurred" }
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return

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
    if (!supabase) {
      setLoading(false)
      setIsInitialized(true)
      return
    }

    let mounted = true

    const initializeAuth = async () => {
      try {
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

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
