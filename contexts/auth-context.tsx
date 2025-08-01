"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: any
  profile: any
  loading: boolean
  isLoading: boolean
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).maybeSingle() // ✅ won't throw if no row

      if (error) {
        console.error("Error fetching profile:", error)
        return null
      }

      // If no profile exists, create one
      if (!data) {
        const { data: inserted, error: insertError } = await supabase
          .from("users")
          .insert({
            auth_user_id: userId,
            email: user?.email || "",
            username: user?.email?.split("@")[0] || "user",
            full_name: user?.user_metadata?.full_name || "",
            tier: "grassroot",
            coins: 100,
            level: 1,
            points: 0,
            is_active: true,
            is_verified: false,
            is_banned: false,
          })
          .select("*")
          .maybeSingle()

        if (insertError) {
          console.error("Error creating profile:", insertError)
          return null
        }
        return inserted
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
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)
      }
      setLoading(false)
    }
    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          router.push("/dashboard")
        }
      } else {
        setProfile(null)
        if (event === "SIGNED_OUT") {
          router.push("/login")
        }
      }
      setLoading(false)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [router])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
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
          data: userData,
        },
      })

      if (error) return { error }

      // Profile will be created automatically in onAuthStateChange
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

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isLoading: loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}
