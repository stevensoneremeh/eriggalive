"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { useSessionContext, useSupabaseClient } from "@supabase/auth-helpers-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Profile {
  id: string
  username: string
  full_name?: string
  display_name?: string
  avatar_url?: string
  subscription_tier: string
  coins_balance?: number
  points?: number
  tier?: string
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
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, isLoading: sessionLoading, error: sessionError } = useSessionContext()
  const supabase = useSupabaseClient()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const user = session?.user || null
  const isAuthenticated = !!user

  // Fetch user profile
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error fetching profile:", error)
        return null
      }

      return data as Profile
    } catch (error) {
      console.error("Error in fetchProfile:", error)
      return null
    }
  }

  // Refresh profile data
  const refreshProfile = async () => {
    if (!user) {
      setProfile(null)
      return
    }

    const profileData = await fetchProfile(user.id)
    setProfile(profileData)
  }

  // Update profile
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return

    try {
      const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id).select().single()

      if (error) throw error

      setProfile(data as Profile)
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      setProfile(null)
      router.push("/")
      toast.success("Signed out successfully")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Error signing out")
    } finally {
      setLoading(false)
    }
  }

  // Handle session changes
  useEffect(() => {
    const handleSessionChange = async () => {
      setLoading(true)

      if (user) {
        await refreshProfile()
      } else {
        setProfile(null)
      }

      setLoading(false)
    }

    handleSessionChange()
  }, [user])

  // Handle session errors
  useEffect(() => {
    if (sessionError) {
      console.error("Session error:", sessionError)
      toast.error("Authentication error occurred")
    }
  }, [sessionError])

  // Set initial loading state
  useEffect(() => {
    if (!sessionLoading) {
      setLoading(false)
    }
  }, [sessionLoading])

  const value: AuthContextType = {
    user,
    profile,
    session,
    isAuthenticated,
    loading: loading || sessionLoading,
    signOut,
    refreshProfile,
    updateProfile,
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
