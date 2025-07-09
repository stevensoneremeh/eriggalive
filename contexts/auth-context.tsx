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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchProfile = async (userId: string) => {
    try {
      // First check if profile exists
      const { data, error, count } = await supabase
        .from("users")
        .select("*", { count: "exact" })
        .eq("auth_user_id", userId)

      if (error) {
        console.error("Error fetching profile:", error)
        return null
      }

      // If no profile exists, create one
      if (!data || data.length === 0) {
        console.log("No profile found, creating one...")
        const { data: authUser } = await supabase.auth.getUser()
        
        if (authUser.user) {
          const newProfile = {
            auth_user_id: userId,
            email: authUser.user.email || "",
            username: authUser.user.user_metadata?.username || authUser.user.email?.split("@")[0] || "user",
            full_name: authUser.user.user_metadata?.full_name || authUser.user.email || "",
            tier: "grassroot" as const,
            coins: 100,
            level: 1,
            points: 0,
            is_active: true,
            is_verified: false,
            is_banned: false,
          }

          const { data: createdProfile, error: createError } = await supabase
            .from("users")
            .insert(newProfile)
            .select()
            .single()

          if (createError) {
            console.error("Error creating profile:", createError)
            return null
          }

          return createdProfile
        }
        return null
      }

      // If multiple profiles exist, return the first one
      if (data.length > 1) {
        console.warn("Multiple profiles found for user, using the first one")
        return data[0]
      }

      return data[0]
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

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id)
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
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
          data: {
            username: userData.username,
            full_name: userData.full_name,
          },
        },
      })

      if (error) return { error }

      // Profile will be created automatically by the auth state change listener
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
    isAuthenticated: !!user,
    isLoading: loading,
    signIn,
    signUp,
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
