"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useSessionContext } from "@supabase/auth-helpers-react"
import type { User, Session } from "@supabase/supabase-js"

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
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateCoins: (amount: number) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, isLoading: sessionLoading, supabaseClient } = useSessionContext()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  const user = session?.user || null
  const isAuthenticated = !!session?.user

  const fetchProfile = useCallback(
    async (userId: string) => {
      if (!userId) return null

      setProfileLoading(true)
      try {
        const { data, error } = await supabaseClient.from("users").select("*").eq("auth_user_id", userId).single()

        if (error) {
          console.error("Error fetching profile:", error)
          return null
        }

        return data
      } catch (error) {
        console.error("Error fetching profile:", error)
        return null
      } finally {
        setProfileLoading(false)
      }
    },
    [supabaseClient],
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
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: username,
          },
        },
      })

      if (error) {
        return { error }
      }

      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabaseClient.from("users").insert({
          auth_user_id: data.user.id,
          username,
          display_name: username,
          full_name: username,
          email,
          subscription_tier: "grassroot",
          coins_balance: 100, // Welcome bonus
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
    try {
      await supabaseClient.auth.signOut()
      setProfile(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Handle session changes and profile fetching
  useEffect(() => {
    const handleSessionChange = async () => {
      if (sessionLoading) {
        setIsLoading(true)
        return
      }

      if (session?.user) {
        // User is authenticated, fetch profile
        const profileData = await fetchProfile(session.user.id)
        if (profileData) {
          setProfile(profileData)
        }
      } else {
        // User is not authenticated, clear profile
        setProfile(null)
      }

      setIsLoading(false)
    }

    handleSessionChange()
  }, [session, sessionLoading, fetchProfile])

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
    isLoading: isLoading || profileLoading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updateCoins,
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
