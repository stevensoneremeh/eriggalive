"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  email: string
  tier: string
  coins: number
  points: number
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  isInitialized: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, username: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  /** Fetch the user profile stored in our `users` table. */
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        // Not found error codes are ignored – we treat them as “no profile yet”
        console.error("Error fetching profile:", error)
        toast.error("Unable to fetch your profile data.")
        return null
      }

      return data as Profile | null
    } catch (err) {
      console.error("Error fetching profile:", err)
      toast.error("Network error fetching profile.")
      return null
    }
  }, [])

  /** Refresh the profile when needed (pull-to-refresh behaviour). */
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const profileData = await fetchProfile(user.id)
    setProfile(profileData)
    setLoading(false)
  }, [user?.id, fetchProfile])

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user?.id) return
      try {
        const { error } = await supabase.from("users").update(updates).eq("auth_user_id", user.id)
        if (error) throw error
        setProfile((prev) => (prev ? { ...prev, ...updates } : null))
        toast.success("Profile updated")
      } catch (err) {
        console.error("Error updating profile:", err)
        toast.error("Unable to update profile")
      }
    },
    [user?.id],
  )

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true)
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return { error: error.message }

        if (data.user) {
          const profileData = await fetchProfile(data.user.id)
          setProfile(profileData)
          router.replace("/dashboard")
          toast.success("Signed in")
        }
        return {}
      } catch (err) {
        console.error("Sign-in error:", err)
        return { error: "Network or server error" }
      } finally {
        setLoading(false)
      }
    },
    [fetchProfile, router],
  )

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      })
      if (error) return { error: error.message }
      toast.success("Account created – check your email to verify!")
      return {}
    } catch (err) {
      console.error("Sign-up error:", err)
      return { error: "Network or server error" }
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setSession(null)
      router.replace("/")
      toast.success("Signed out")
    } catch (err) {
      console.error("Sign-out error:", err)
      toast.error("Unable to sign out")
    } finally {
      setLoading(false)
    }
  }, [router])

  /* ---------- INITIALISE AUTH STATE ---------- */
  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (!mounted) return

        setSession(initialSession)
        setUser(initialSession?.user ?? null)

        if (initialSession?.user) {
          const profileData = await fetchProfile(initialSession.user.id)
          if (mounted) setProfile(profileData)
        }
      } catch (err) {
        console.error("Auth initialise error:", err)
      } finally {
        if (mounted) {
          setLoading(false)
          setIsInitialized(true)
        }
      }
    }

    init()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, newSession) => {
      if (!mounted) return
      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        const profileData = await fetchProfile(newSession.user.id)
        if (mounted) setProfile(profileData)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const ctx: AuthContextType = {
    user,
    profile,
    session,
    loading,
    isAuthenticated: !!user,
    isInitialized,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  }

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
