"use client"

import type { ReactNode } from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { User } from "@supabase/supabase-js"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  email: string
  tier: string
  coins: number
  points: number
  level: number
  created_at: string
  updated_at: string
}

interface AuthCtx {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAuthenticated: boolean
  isInitialized: boolean
  signIn: (e: string, p: string) => Promise<{ error?: string }>
  signUp: (e: string, p: string, meta: any) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInit, setIsInit] = useState(false)
  const supabase = createClient()

  /* ----------------  helpers  ---------------- */
  const fetchProfile = useCallback(
    async (uid: string) => {
      const { data } = await supabase.from("users").select("*").eq("auth_user_id", uid).maybeSingle()
      return data as Profile | null
    },
    [supabase],
  )

  const refreshProfile = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setProfile(await fetchProfile(user.id))
    setLoading(false)
  }, [user, fetchProfile])

  /* ---------------  auth actions  ------------- */
  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      return { error: error.message }
    }
    setUser(data.user!)
    await refreshProfile()
    toast.success("Signed in!")
    setLoading(false)
    return {}
  }

  const signUp = async (email: string, password: string, meta: any) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: meta } })
    if (error) {
      setLoading(false)
      return { error: error.message }
    }
    toast.success("Account created!")
    setLoading(false)
    return {}
  }

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    toast.success("Signed out")
    setLoading(false)
  }

  /* -------------  initial load & listener ------------- */
  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (!alive) return
      if (data.session?.user) {
        setUser(data.session.user)
        setProfile(await fetchProfile(data.session.user.id))
      }
      setLoading(false)
      setIsInit(true)
    })()

    const { data: listener } = supabase.auth.onAuthStateChange((ev, sess) => {
      if (!alive) return
      if (ev === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
      }
      if (ev === "SIGNED_IN" && sess?.user) {
        setUser(sess.user)
        refreshProfile()
      }
    })

    return () => {
      alive = false
      listener.subscription.unsubscribe()
    }
  }, [fetchProfile, refreshProfile, supabase])

  const value: AuthCtx = {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isInitialized: isInit,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
