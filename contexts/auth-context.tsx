"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

type UserProfile = Database["public"]["Tables"]["users"]["Row"]

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  isInitialized: boolean
  isPreviewMode: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: any }>
  signUp: (
    email: string,
    password: string,
    username: string,
    fullName: string,
  ) => Promise<{ success: boolean; error?: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  const supabase = createClient()

  // Check if we're in preview mode
  const isPreviewMode =
    typeof window !== "undefined" &&
    (window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("v0.dev"))

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      try {
        setIsLoading(true)

        if (isPreviewMode) {
          // Mock user for preview mode
          const mockUser = {
            id: "preview-user-id",
            email: "preview@example.com",
            user_metadata: { username: "previewuser", full_name: "Preview User" },
          } as User

          const mockProfile = {
            id: 1,
            auth_user_id: "preview-user-id",
            username: "previewuser",
            full_name: "Preview User",
            email: "preview@example.com",
            tier: "grassroot" as const,
            coins: 500,
            level: 1,
            points: 0,
            avatar_url: null,
            is_verified: false,
            is_active: true,
            is_banned: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as UserProfile

          if (mounted) {
            setUser(mockUser)
            setProfile(mockProfile)
            setSession({ user: mockUser } as Session)
            setIsInitialized(true)
            setIsLoading(false)
          }
          return
        }

        // Get initial session
        const {
          data: { session: initialSession },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
        }

        if (mounted && initialSession?.user) {
          setUser(initialSession.user)
          setSession(initialSession)
          await loadUserProfile(initialSession.user.id)
        }

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return

          console.log("Auth state changed:", event, session?.user?.id)

          if (session?.user) {
            setUser(session.user)
            setSession(session)
            await loadUserProfile(session.user.id)
          } else {
            setUser(null)
            setProfile(null)
            setSession(null)
          }
        })

        if (mounted) {
          setIsInitialized(true)
          setIsLoading(false)
        }

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        if (mounted) {
          setIsInitialized(true)
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [isPreviewMode])

  const loadUserProfile = async (authUserId: string) => {
    try {
      const { data: userProfile, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", authUserId)
        .single()

      if (error) {
        console.error("Profile fetch error:", error)
        return
      }

      if (userProfile) {
        setProfile(userProfile)
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      if (isPreviewMode) {
        // Mock successful sign in for preview
        return { success: true }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        return { success: false, error }
      }

      if (data.user) {
        setUser(data.user)
        setSession(data.session)
        await loadUserProfile(data.user.id)
      }

      return { success: true }
    } catch (error) {
      console.error("Sign in error:", error)
      return { success: false, error }
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    try {
      setIsLoading(true)

      if (isPreviewMode) {
        // Mock successful sign up for preview
        return { success: true }
      }

      // First, sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: username.trim(),
            full_name: fullName.trim(),
          },
        },
      })

      if (authError) {
        console.error("Auth signup error:", authError)
        return { success: false, error: authError }
      }

      if (authData.user) {
        // Create user profile
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .insert({
            auth_user_id: authData.user.id,
            username: username.trim(),
            full_name: fullName.trim(),
            email: email.trim(),
            tier: "grassroot",
            coins: 100, // Welcome bonus
            level: 1,
            points: 0,
            is_verified: false,
            is_active: true,
            is_banned: false,
          })
          .select()
          .single()

        if (profileError) {
          console.error("Profile creation error:", profileError)
          return { success: false, error: profileError }
        }

        setUser(authData.user)
        setSession(authData.session)
        setProfile(profileData)
      }

      return { success: true }
    } catch (error) {
      console.error("Sign up error:", error)
      return { success: false, error }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)

      if (!isPreviewMode) {
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error("Sign out error:", error)
        }
      }

      setUser(null)
      setProfile(null)
      setSession(null)
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      await loadUserProfile(user.id)
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated: !!user,
    isInitialized,
    isPreviewMode,
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
