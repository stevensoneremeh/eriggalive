"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import type { User, Session } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

type UserProfile = Database["public"]["Tables"]["users"]["Row"]

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (
    email: string,
    password: string,
    userData: { username: string; full_name: string },
  ) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const createUserProfile = async (authUser: User, userData?: { username: string; full_name: string }) => {
    try {
      const profileData = {
        auth_user_id: authUser.id,
        email: authUser.email!,
        username: userData?.username || authUser.user_metadata?.username || authUser.email?.split("@")[0] || "user",
        full_name: userData?.full_name || authUser.user_metadata?.full_name || null,
        tier: "grassroot" as const,
        coins: 100,
        level: 1,
        points: 0,
        is_verified: false,
        is_active: true,
        is_banned: false,
        role: "user" as const,
        login_count: 1,
        email_verified: authUser.email_confirmed_at ? true : false,
        phone_verified: false,
        two_factor_enabled: false,
        preferences: {},
        metadata: {},
      }

      const { data, error } = await supabase.from("users").insert(profileData).select().single()

      if (error) {
        console.error("Error creating user profile:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in createUserProfile:", error)
      return null
    }
  }

  const fetchProfile = async (userId: string) => {
    try {
      const { data: existingProfiles, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", userId)

      if (fetchError) {
        console.error("Error fetching profiles:", fetchError)
        return null
      }

      if (!existingProfiles || existingProfiles.length === 0) {
        console.log("No profile found for user:", userId)
        return null
      }

      // If multiple profiles exist, keep the first one and delete the rest
      if (existingProfiles.length > 1) {
        console.log(`Found ${existingProfiles.length} profiles for user ${userId}, cleaning up...`)
        const keepProfile = existingProfiles[0]
        const duplicateIds = existingProfiles.slice(1).map((p) => p.id)

        const { error: deleteError } = await supabase.from("users").delete().in("id", duplicateIds)

        if (deleteError) {
          console.error("Error deleting duplicate profiles:", deleteError)
        } else {
          console.log(`Deleted ${duplicateIds.length} duplicate profiles`)
        }

        return keepProfile
      }

      return existingProfiles[0]
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
            let profileData = await fetchProfile(initialSession.user.id)

            // If no profile exists, create one
            if (!profileData) {
              profileData = await createUserProfile(initialSession.user)
            }

            if (mounted) {
              setProfile(profileData)
            }
          }

          setLoading(false)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.email)

      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          let profileData = await fetchProfile(session.user.id)

          // If no profile exists, create one (for new signups)
          if (!profileData && event === "SIGNED_UP") {
            profileData = await createUserProfile(session.user)
          }

          if (mounted) {
            setProfile(profileData)
          }

          // Only redirect on sign in, not on initial load
          if (event === "SIGNED_IN" || event === "SIGNED_UP") {
            router.push("/dashboard")
          }
        } else {
          if (mounted) {
            setProfile(null)
          }

          if (event === "SIGNED_OUT") {
            router.push("/login")
          }
        }

        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

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

  const signUp = async (email: string, password: string, userData: { username: string; full_name: string }) => {
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

      // Profile will be created in the auth state change handler
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    isLoading: loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
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
