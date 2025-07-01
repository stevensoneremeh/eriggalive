"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

type UserProfile = Database["public"]["Tables"]["users"]["Row"]

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (
    email: string,
    password: string,
    userData: { username: string; full_name: string },
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

  const supabase = createClient()

  const fetchProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      try {
        const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).single()

        if (error) {
          console.error("Error fetching profile:", error)

          // If profile doesn't exist, create it
          if (error.code === "PGRST116") {
            const {
              data: { user: authUser },
            } = await supabase.auth.getUser()
            if (authUser) {
              const newProfile = {
                auth_user_id: authUser.id,
                email: authUser.email || "",
                username: authUser.user_metadata?.username || authUser.email?.split("@")[0] || "user",
                full_name: authUser.user_metadata?.full_name || authUser.email || "",
                tier: "grassroot" as const,
                role: "user" as const,
                coins: 100,
                level: 1,
                points: 0,
                is_verified: false,
                is_active: true,
                is_banned: false,
                login_count: 0,
                email_verified: authUser.email_confirmed_at ? true : false,
                phone_verified: false,
                two_factor_enabled: false,
                preferences: {},
                metadata: {},
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
          }
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
    if (user) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }, [user, fetchProfile])

  const updateLoginCount = useCallback(
    async (userId: string) => {
      try {
        await supabase
          .from("users")
          .update({
            login_count: supabase.raw("login_count + 1"),
            last_login: new Date().toISOString(),
          })
          .eq("auth_user_id", userId)
      } catch (error) {
        console.error("Error updating login count:", error)
      }
    },
    [supabase],
  )

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("Auth state changed:", event, session?.user?.id)

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id)
        if (mounted) {
          setProfile(profileData)
        }

        // Update login count on sign in
        if (event === "SIGNED_IN") {
          await updateLoginCount(session.user.id)
        }
      } else {
        if (mounted) {
          setProfile(null)
        }
      }

      if (mounted && !loading) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile, updateLoginCount, loading])

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        return { error }
      } catch (error) {
        console.error("Sign in error:", error)
        return { error }
      } finally {
        setLoading(false)
      }
    },
    [supabase],
  )

  const signUp = useCallback(
    async (email: string, password: string, userData: { username: string; full_name: string }) => {
      try {
        setLoading(true)

        // Check if username is already taken
        const { data: existingUser } = await supabase
          .from("users")
          .select("username")
          .eq("username", userData.username.trim())
          .single()

        if (existingUser) {
          return { error: { message: "Username is already taken" } }
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              username: userData.username.trim(),
              full_name: userData.full_name.trim(),
            },
          },
        })

        if (error) return { error }

        // Create user profile
        if (data.user) {
          const profileData = {
            auth_user_id: data.user.id,
            email: email.trim(),
            username: userData.username.trim(),
            full_name: userData.full_name.trim(),
            tier: "grassroot" as const,
            role: "user" as const,
            coins: 100, // Starting coins
            level: 1,
            points: 0,
            is_active: true,
            is_verified: false,
            is_banned: false,
            login_count: 0,
            email_verified: data.user.email_confirmed_at ? true : false,
            phone_verified: false,
            two_factor_enabled: false,
            preferences: {},
            metadata: {},
          }

          const { error: profileError } = await supabase.from("users").insert(profileData)

          if (profileError) {
            console.error("Error creating profile:", profileError)
            // Don't return error here as auth user was created successfully
          }
        }

        return { error: null }
      } catch (error) {
        console.error("Sign up error:", error)
        return { error }
      } finally {
        setLoading(false)
      }
    },
    [supabase],
  )

  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const value = {
    user,
    session,
    profile,
    loading: loading || !initialized,
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
