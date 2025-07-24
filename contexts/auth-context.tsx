"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"

interface Profile {
  id: string
  username: string
  email: string
  avatar_url?: string
  tier: string
  role: string
  coins: number
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(
    async (userId: string) => {
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
    },
    [supabase],
  )

  const createProfile = useCallback(
    async (user: User, username?: string) => {
      try {
        const profileData = {
          id: user.id,
          username: username || user.email?.split("@")[0] || "user",
          email: user.email || "",
          tier: "grassroot",
          role: "user",
          coins: 0,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { data, error } = await supabase.from("profiles").insert([profileData]).select().single()

        if (error) {
          console.error("Error creating profile:", error)
          return null
        }

        return data
      } catch (error) {
        console.error("Error in createProfile:", error)
        return null
      }
    },
    [supabase],
  )

  const refreshProfile = useCallback(async () => {
    if (!user) return

    const profileData = await fetchProfile(user.id)
    setProfile(profileData)
  }, [user, fetchProfile])

  const signIn = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        if (data.user) {
          setUser(data.user)
          setSession(data.session)

          let profileData = await fetchProfile(data.user.id)
          if (!profileData) {
            profileData = await createProfile(data.user)
          }
          setProfile(profileData)
        }
      } catch (error) {
        console.error("Sign in error:", error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [supabase, fetchProfile, createProfile],
  )

  const signUp = useCallback(
    async (email: string, password: string, username: string) => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        if (data.user) {
          setUser(data.user)
          setSession(data.session)

          const profileData = await createProfile(data.user, username)
          setProfile(profileData)
        }
      } catch (error) {
        console.error("Sign up error:", error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [supabase, createProfile],
  )

  const signOut = useCallback(async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setProfile(null)
      setSession(null)
    } catch (error) {
      console.error("Sign out error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("profiles")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", user.id)
          .select()
          .single()

        if (error) throw error

        setProfile(data)
      } catch (error) {
        console.error("Update profile error:", error)
        throw error
      }
    },
    [user, supabase],
  )

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
    updateProfile,
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
