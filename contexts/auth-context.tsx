"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

type UserProfile = Database["public"]["Tables"]["users"]["Row"]

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(
    async (userId: string) => {
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

  const createProfile = useCallback(
    async (user: User, username?: string) => {
      try {
        const profileData = {
          auth_user_id: user.id,
          username: username || user.email?.split("@")[0] || "user",
          email: user.email || "",
          full_name: username || user.email?.split("@")[0] || "user",
          tier: "grassroot",
          coins_balance: 100,
          level: 1,
          points: 0,
          is_active: true,
          is_verified: false,
          is_banned: false,
        }

        const { data, error } = await supabase.from("users").insert([profileData])

        if (error) {
          console.error("Error creating profile:", error)
          return null
        }

        // Fetch the created profile
        const createdProfile = await fetchProfile(user.id)
        return createdProfile
      } catch (error) {
        console.error("Error in createProfile:", error)
        return null
      }
    },
    [supabase, fetchProfile],
  )

  const refreshProfile = useCallback(async () => {
    if (!user) return

    const profileData = await fetchProfile(user.id)
    setProfile(profileData)
  }, [user, fetchProfile])

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          return { error }
        }

        if (data.user) {
          setUser(data.user)
          setSession(data.session)

          let profileData = await fetchProfile(data.user.id)
          if (!profileData) {
            profileData = await createProfile(data.user)
          }
          setProfile(profileData)
        }

        return { error: null }
      } catch (error) {
        return { error }
      }
    },
    [supabase, fetchProfile, createProfile],
  )

  const signUp = useCallback(
    async (email: string, password: string, username: string) => {
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
          return { error }
        }

        if (data.user) {
          setUser(data.user)
          setSession(data.session)

          const profileData = await createProfile(data.user, username)
          setProfile(profileData)
        }

        return { error: null }
      } catch (error) {
        return { error }
      }
    },
    [supabase, createProfile],
  )

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setProfile(null)
      setSession(null)
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }, [supabase])

  useEffect(() => {
    let mounted = true

    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          return
        }

        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)

          if (session?.user) {
            let profileData = await fetchProfile(session.user.id)
            if (!profileData) {
              profileData = await createProfile(session.user)
            }
            if (mounted) {
              setProfile(profileData)
            }
          }
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        let profileData = await fetchProfile(session.user.id)
        if (!profileData) {
          profileData = await createProfile(session.user)
        }
        if (mounted) {
          setProfile(profileData)
        }
      } else {
        setProfile(null)
      }

      if (mounted) {
        setIsLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile, createProfile])

  const value = {
    user,
    profile,
    session,
    isAuthenticated: !!user,
    isLoading,
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
