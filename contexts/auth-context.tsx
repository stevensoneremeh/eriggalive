"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

type UserProfile = Database["public"]["Tables"]["users"]["Row"]

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (
    email: string,
    password: string,
    userData: { username: string; full_name: string; tier?: string },
  ) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  navigationManager?: {
    handleAuthRequiredNavigation: (path: string) => void
  }
  isInitialized: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  const supabase = createClient()

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).single()

      if (error) {
        console.error("Error fetching profile:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in fetchProfile:", error)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }

  const navigationManager = {
    handleAuthRequiredNavigation: (path: string) => {
      if (typeof window !== "undefined") {
        window.location.href = `/login?redirect=${encodeURIComponent(path)}`
      }
    },
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)

          if (session?.user) {
            const profileData = await fetchProfile(session.user.id)
            setProfile(profileData)
          }

          setLoading(false)
          setIsInitialized(true)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
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

      console.log("Auth state changed:", event, session?.user?.email)

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)
      } else {
        setProfile(null)
      }

      if (!loading) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        setLoading(false)
        return { error }
      }

      // The auth state change listener will handle setting user and profile
      console.log("Sign in successful:", data.user?.email)
      return { error: null }
    } catch (error) {
      console.error("Sign in exception:", error)
      setLoading(false)
      return { error }
    }
  }

  const signUp = async (
    email: string,
    password: string,
    userData: { username: string; full_name: string; tier?: string },
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      })

      if (error) return { error }

      // Create user profile
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
          is_active: true,
          is_verified: false,
          is_banned: false,
        })

        if (profileError) {
          console.error("Error creating profile:", profileError)
        }
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user && !!profile,
    isLoading: loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    navigationManager,
    isInitialized,
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
