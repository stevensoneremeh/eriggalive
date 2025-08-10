"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

type UserProfile = Database["public"]["Tables"]["users"]["Row"]

interface AuthContextType {
  user: any | null
  profile: UserProfile | null
  loading: boolean
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser()
  const { signOut: clerkSignOut } = useClerkAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
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
    },
    [supabase],
  )

  const refreshProfile = useCallback(async () => {
    if (clerkUser) {
      const profileData = await fetchProfile(clerkUser.id)
      setProfile(profileData)
    }
  }, [clerkUser, fetchProfile])

  useEffect(() => {
    const initializeProfile = async () => {
      if (isLoaded) {
        if (clerkUser) {
          // Check if user profile exists, create if not
          let profileData = await fetchProfile(clerkUser.id)

          if (!profileData) {
            // Create user profile
            const { data, error } = await supabase
              .from("users")
              .insert({
                auth_user_id: clerkUser.id,
                username: clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress.split("@")[0] || "user",
                full_name: clerkUser.fullName || "",
                email: clerkUser.emailAddresses[0]?.emailAddress || "",
                tier: "grassroot",
                coins: 0,
                level: 1,
                points: 0,
                is_verified: false,
                is_active: true,
                is_banned: false,
              })
              .select()
              .single()

            if (!error && data) {
              profileData = data
            }
          }

          setProfile(profileData)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    }

    initializeProfile()
  }, [clerkUser, isLoaded, fetchProfile, supabase])

  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      await clerkSignOut()
      setProfile(null)
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setLoading(false)
    }
  }, [clerkSignOut])

  const value = {
    user: clerkUser,
    profile,
    loading: loading || !isLoaded,
    isLoading: loading || !isLoaded,
    isAuthenticated: !!clerkUser,
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
