"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
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
  const [initialized, setInitialized] = useState(false)
  const supabaseRef = useRef(createClient())

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabaseRef.current.from("users").select("*").eq("auth_user_id", userId).single()

      if (error) {
        if (error.message?.includes("PGRST116") || error.code === "PGRST116") {
          // No profile exists, create one
          try {
            const { data: authUser } = await supabaseRef.current.auth.getUser()

            if (authUser.user) {
              const newProfile = {
                auth_user_id: userId,
                email: authUser.user.email || "",
                username: authUser.user.user_metadata?.username || authUser.user.email?.split("@")[0] || "user",
                full_name: authUser.user.user_metadata?.full_name || authUser.user.email || "",
                subscription_tier: "grassroot" as const,
                coins_balance: 100,
                level: 1,
                points: 0,
                is_active: true,
                is_verified: false,
                is_banned: false,
              }

              const { data: createdProfile, error: createError } = await supabaseRef.current
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
          } catch (createErr) {
            console.error("Error in profile creation:", createErr)
            return null
          }
        } else {
          console.error("Error fetching profile:", error)
        }
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

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session: initialSession },
          error: sessionError,
        } = await supabaseRef.current.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
        }

        if (mounted) {
          setSession(initialSession)
          setUser(initialSession?.user ?? null)

          if (initialSession?.user) {
            const profileData = await fetchProfile(initialSession.user.id)
            if (mounted) {
              setProfile(profileData)
            }
          }

          setLoading(false)
          setInitialized(true)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseRef.current.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event)

      if (mounted && initialized) {
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

        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [initialized])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabaseRef.current.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setLoading(false)
        return { error }
      }

      // Don't set loading to false here - let auth state change handle it
      return { error: null }
    } catch (error) {
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
      setLoading(true)
      const { data, error } = await supabaseRef.current.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userData.username,
            full_name: userData.full_name,
          },
        },
      })

      if (error) {
        setLoading(false)
        return { error }
      }

      // Don't set loading to false here if user needs email confirmation
      if (!data.user?.email_confirmed_at) {
        setLoading(false)
      }

      return { error: null }
    } catch (error) {
      setLoading(false)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await supabaseRef.current.auth.signOut()
      // Auth state change will handle the rest
    } catch (error) {
      console.error("Sign out error:", error)
      setLoading(false)
    }
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
