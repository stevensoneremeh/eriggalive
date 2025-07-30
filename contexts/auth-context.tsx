"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { useSessionContext, useSupabaseClient } from "@supabase/auth-helpers-react"
import { toast } from "sonner"

interface Profile {
  id: string
  username: string
  full_name?: string
  display_name?: string
  avatar_url?: string
  subscription_tier?: string
  coins_balance?: number
  points?: number
  email?: string
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  isAuthenticated: boolean
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, isLoading: sessionLoading } = useSessionContext()
  const supabase = useSupabaseClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const user = session?.user || null
  const isAuthenticated = !!user

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

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
    if (!user) {
      setProfile(null)
      return
    }

    const profileData = await fetchProfile(user.id)
    setProfile(profileData)
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
        toast.error("Error signing out")
      } else {
        setProfile(null)
        toast.success("Signed out successfully")
      }
    } catch (error) {
      console.error("Sign out error:", error)
      toast.error("Error signing out")
    } finally {
      setLoading(false)
    }
  }

  // Load profile when user changes
  useEffect(() => {
    if (sessionLoading) return

    if (user) {
      refreshProfile()
    } else {
      setProfile(null)
    }

    setLoading(false)
  }, [user, sessionLoading])

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)
      } else if (event === "SIGNED_OUT") {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const value: AuthContextType = {
    user,
    profile,
    session,
    isAuthenticated,
    loading: loading || sessionLoading,
    signOut,
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
