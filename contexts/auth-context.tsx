"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface Profile {
  id: string
  username: string
  full_name: string
  email: string
  avatar_url?: string
  tier: string
  role: string
  coins_balance: number
  created_at: string
  updated_at: string
  is_active: boolean
  bio?: string
  location?: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const createProfile = async (userId: string, email: string, username: string, fullName: string) => {
    try {
      // First insert the profile
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: userId,
          username,
          full_name: fullName,
          email,
          tier: "grassroot",
          role: "user",
          coins_balance: 100,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])

      if (insertError) {
        console.error("Error creating profile:", insertError)
        throw insertError
      }

      // Then fetch the created profile
      const { data: profileData, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single()

      if (fetchError) {
        console.error("Error fetching created profile:", fetchError)
        throw fetchError
      }

      return profileData
    } catch (error) {
      console.error("Error in createProfile:", error)
      throw error
    }
  }

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error loading profile:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in loadProfile:", error)
      return null
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        const profileData = await loadProfile(data.user.id)
        setProfile(profileData)
      }
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        const profileData = await createProfile(data.user.id, email, username, fullName)
        setProfile(profileData)
      }
    } catch (error) {
      console.error("Sign up error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error("Sign out error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!profile) throw new Error("No profile to update")

      const { data, error } = await supabase
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
    } catch (error) {
      console.error("Update profile error:", error)
      throw error
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          const profileData = await loadProfile(session.user.id)
          setProfile(profileData)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        const profileData = await loadProfile(session.user.id)
        setProfile(profileData)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    profile,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
