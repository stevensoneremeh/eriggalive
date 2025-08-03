"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type Profile = Database["public"]["Tables"]["users"]["Row"]

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    userData: { username: string; full_name: string },
  ) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in fetchProfile:", error)
      return null
    }
  }

  const createProfile = async (
    user: User,
    userData?: { username: string; full_name: string },
  ): Promise<Profile | null> => {
    try {
      const profileData = {
        auth_user_id: user.id,
        email: user.email!,
        username: userData?.username || user.user_metadata?.username || user.email?.split("@")[0] || "user",
        full_name: userData?.full_name || user.user_metadata?.full_name || null,
        tier: "grassroot" as const,
        role: "user" as const,
        coins: 500, // Starting balance
        level: 1,
        points: 0,
        is_verified: false,
        is_active: true,
        is_banned: false,
        login_count: 1,
        email_verified: !!user.email_confirmed_at,
        phone_verified: false,
        two_factor_enabled: false,
        preferences: {},
        metadata: {},
      }

      const { data, error } = await supabase.from("users").insert(profileData).select().single()

      if (error) {
        console.error("Error creating profile:", error)
        return null
      }

      // Show welcome toast for new users
      toast.success("Welcome to Erigga Live!", {
        description: "Your account has been created with 500 free coins!",
      })

      return data
    } catch (error) {
      console.error("Error in createProfile:", error)
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
    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        setSession(initialSession)
        setUser(initialSession?.user ?? null)

        if (initialSession?.user) {
          let profileData = await fetchProfile(initialSession.user.id)

          // Create profile if it doesn't exist
          if (!profileData) {
            profileData = await createProfile(initialSession.user)
          }

          setProfile(profileData)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id)

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        let profileData = await fetchProfile(session.user.id)

        // Create profile for new signups
        if (!profileData && event === "SIGNED_UP") {
          profileData = await createProfile(session.user)
        }

        setProfile(profileData)

        // Redirect to dashboard on successful auth
        if (event === "SIGNED_IN" || event === "SIGNED_UP") {
          const redirectTo = new URLSearchParams(window.location.search).get("redirectTo")
          router.push(redirectTo || "/dashboard")
          router.refresh() // Refresh to update server components
        }
      } else {
        setProfile(null)

        // Redirect to signin on signout
        if (event === "SIGNED_OUT") {
          router.push("/auth/signin")
          router.refresh()
        }
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  // Real-time coins subscription
  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel("coins-listener")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          setProfile((prev) => (prev ? { ...prev, coins: payload.new.coins } : null))
          toast.success(`Coins updated: ${payload.new.coins}`)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, supabase])

  const signUp = async (email: string, password: string, userData: { username: string; full_name: string }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

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

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
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
