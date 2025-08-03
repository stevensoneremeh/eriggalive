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
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  children,
  initialSession,
  initialProfile,
}: {
  children: React.ReactNode
  initialSession?: Session | null
  initialProfile?: Profile | null
}) {
  const [user, setUser] = useState<User | null>(initialSession?.user || null)
  const [profile, setProfile] = useState<Profile | null>(initialProfile || null)
  const [session, setSession] = useState<Session | null>(initialSession || null)
  const [loading, setLoading] = useState(!initialSession)
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
        coins: 500,
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

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return

    try {
      const { data, error } = await supabase.from("users").update(updates).eq("id", profile.id).select().single()

      if (error) throw error

      setProfile(data)
      toast.success("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    }
  }

  useEffect(() => {
    // If we have initial data, we're already loaded
    if (initialSession && initialProfile) {
      setLoading(false)
      return
    }

    const initializeAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession()

        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          let profileData = await fetchProfile(currentSession.user.id)

          if (!profileData) {
            profileData = await createProfile(currentSession.user)
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

        if (!profileData && event === "SIGNED_UP") {
          profileData = await createProfile(session.user)
        }

        setProfile(profileData)

        if (event === "SIGNED_IN" || event === "SIGNED_UP") {
          const redirectTo = new URLSearchParams(window.location.search).get("redirectTo")
          router.push(redirectTo || "/dashboard")
          router.refresh()
        }
      } else {
        setProfile(null)

        if (event === "SIGNED_OUT") {
          router.push("/auth/signin")
          router.refresh()
        }
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [router, supabase.auth, initialSession, initialProfile])

  // Real-time profile updates
  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel("profile-listener")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          setProfile(payload.new as Profile)
          if (payload.new.coins !== profile.coins) {
            toast.success(`Coins updated: ${payload.new.coins}`)
          }
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
    updateProfile,
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
