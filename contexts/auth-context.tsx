"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"
import { toast } from "sonner"

interface UserProfile {
  id: number
  auth_user_id: string
  username: string
  display_name: string
  full_name: string
  email: string
  subscription_tier: string
  coins_balance: number
  avatar_url: string | null
  bio: string | null
  location: string | null
  website: string | null
  total_posts: number
  total_votes_received: number
  total_comments: number
  is_verified: boolean
  is_active: boolean
  last_seen_at: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, metadata: any) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateCoins: (amount: number) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)

  const supabase = createClient()

  const fetchProfile = useCallback(
    async (userId: string) => {
      if (!userId) return null

      try {
        const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).single()

        if (error) {
          console.error("Error fetching profile:", error)
          return null
        }

        return data
      } catch (error) {
        console.error("Error fetching profile:", error)
        return null
      }
    },
    [supabase],
  )

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return

    const profileData = await fetchProfile(user.id)
    if (profileData) {
      setProfile(profileData)
    }
  }, [user?.id, fetchProfile])

  const updateCoins = useCallback(
    (amount: number) => {
      if (profile) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                coins_balance: Math.max(0, prev.coins_balance + amount),
              }
            : null,
        )
      }
    },
    [profile],
  )

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      return { error: null }
    } catch (error) {
      return { error }
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, metadata: any) => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: metadata.username,
            full_name: metadata.full_name,
          },
        },
      })

      if (error) {
        return { error }
      }

      // Create user profile if sign up was successful
      if (data.user && !error) {
        const { error: profileError } = await supabase.from("users").insert({
          auth_user_id: data.user.id,
          username: metadata.username,
          display_name: metadata.username,
          full_name: metadata.full_name,
          email,
          subscription_tier: metadata.tier || "grassroot",
          coins_balance: metadata.tier === "grassroot" ? 100 : metadata.tier === "pioneer" ? 500 : 1000,
        })

        if (profileError) {
          console.error("Error creating profile:", profileError)
          // Don't return error here as the user account was created successfully
        }
      }

      return { error: null }
    } catch (error) {
      return { error }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setProfile(null)
      setIsAuthenticated(false)
      toast.success("Signed out successfully")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Error signing out")
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    let isMounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          if (isMounted) setIsLoading(false)
          return
        }

        if (session?.user && isMounted) {
          setSession(session)
          setUser(session.user)
          setIsAuthenticated(true)

          // Fetch user profile
          const profileData = await fetchProfile(session.user.id)
          if (profileData && isMounted) {
            setProfile(profileData)
          }
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id)

      if (!isMounted) return

      if (event === "SIGNED_IN" && session?.user) {
        setSession(session)
        setUser(session.user)
        setIsAuthenticated(true)

        // Fetch user profile
        const profileData = await fetchProfile(session.user.id)
        if (profileData) {
          setProfile(profileData)
        }

        toast.success("Signed in successfully")
      } else if (event === "SIGNED_OUT") {
        setSession(null)
        setUser(null)
        setProfile(null)
        setIsAuthenticated(false)
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        setSession(session)
        setUser(session.user)
      }

      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [mounted, supabase.auth, fetchProfile])

  // Auto-refresh profile every 5 minutes to keep coin balance updated
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return

    const interval = setInterval(
      () => {
        refreshProfile()
      },
      5 * 60 * 1000,
    ) // 5 minutes

    return () => clearInterval(interval)
  }, [isAuthenticated, user?.id, refreshProfile])

  const value: AuthContextType = {
    user,
    session,
    profile,
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updateCoins,
  }

  // Don't render children until mounted to prevent hydration issues
  if (!mounted) {
    return null
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
