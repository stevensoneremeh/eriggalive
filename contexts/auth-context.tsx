"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Profile {
  id: string
  username: string | null
  email: string
  avatar_url: string | null
  tier: "grassroot" | "pioneer" | "elder" | "blood"
  coins: number
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
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
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const hasShownWelcomeToast = useRef(false)

  const isAuthenticated = !!user && !!session

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error fetching profile:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error fetching profile:", error)
      return null
    }
  }

  const refreshProfile = async () => {
    if (!user) return
    const profileData = await fetchProfile(user.id)
    if (profileData) {
      setProfile(profileData)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile)
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)

        // Only show welcome toast on actual sign in, not on page refresh
        if (event === "SIGNED_IN" && !hasShownWelcomeToast.current) {
          toast.success("Welcome back!", {
            description: "You have successfully signed in.",
          })
          hasShownWelcomeToast.current = true
        }
      } else {
        setProfile(null)
        // Reset the flag when user signs out
        hasShownWelcomeToast.current = false
      }

      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, username: string) => {
    try {
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
        toast.error("Sign up failed", {
          description: error.message,
        })
        return { error }
      }

      if (data.user && !data.session) {
        toast.success("Check your email", {
          description: "We sent you a confirmation link.",
        })
      }

      return { error: null }
    } catch (error) {
      console.error("Sign up error:", error)
      toast.error("Sign up failed", {
        description: "An unexpected error occurred.",
      })
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error("Sign in failed", {
          description: error.message,
        })
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error("Sign in error:", error)
      toast.error("Sign in failed", {
        description: "An unexpected error occurred.",
      })
      return { error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error("Sign out failed", {
          description: error.message,
        })
      } else {
        toast.success("Signed out successfully")
        hasShownWelcomeToast.current = false
      }
    } catch (error) {
      console.error("Sign out error:", error)
      toast.error("Sign out failed", {
        description: "An unexpected error occurred.",
      })
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("No user logged in") }

    try {
      const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id).select().single()

      if (error) {
        toast.error("Profile update failed", {
          description: error.message,
        })
        return { error }
      }

      setProfile(data)
      toast.success("Profile updated successfully")
      return { error: null }
    } catch (error) {
      console.error("Profile update error:", error)
      toast.error("Profile update failed", {
        description: "An unexpected error occurred.",
      })
      return { error }
    }
  }

  const value = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
