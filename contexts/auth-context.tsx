"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import {
  ROUTES,
  isProtectedRoute,
  isAuthRoute,
  storeRedirectPath,
  getStoredRedirectPath,
  clearStoredRedirectPath,
} from "@/lib/navigation-utils"

interface AuthUser extends User {
  tier?: string
  coins?: number
  full_name?: string
  username?: string
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (
    email: string,
    password: string,
    username?: string,
    fullName?: string,
  ) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const isAuthenticated = !!user

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth initialization error:", error)
          if (mounted) {
            setUser(null)
            setIsLoading(false)
            setIsInitialized(true)
          }
          return
        }

        if (session?.user && mounted) {
          // Fetch additional user data
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("tier, coins, full_name, username")
            .eq("id", session.user.id)
            .single()

          const authUser: AuthUser = {
            ...session.user,
            tier: profile?.tier || "grassroot",
            coins: profile?.coins || 0,
            full_name: profile?.full_name,
            username: profile?.username,
          }

          setUser(authUser)
        } else if (mounted) {
          setUser(null)
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
          setIsInitialized(true)
        }
      }
    }

    initializeAuth()

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === "SIGNED_IN" && session?.user) {
        // Fetch additional user data
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("tier, coins, full_name, username")
          .eq("id", session.user.id)
          .single()

        const authUser: AuthUser = {
          ...session.user,
          tier: profile?.tier || "grassroot",
          coins: profile?.coins || 0,
          full_name: profile?.full_name,
          username: profile?.username,
        }

        setUser(authUser)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  // Handle route protection
  useEffect(() => {
    if (!isInitialized || isLoading) return

    const currentPath = pathname || "/"

    // If user is authenticated and on auth routes, redirect to dashboard
    if (isAuthenticated && isAuthRoute(currentPath)) {
      const redirectPath = getStoredRedirectPath()
      clearStoredRedirectPath()
      router.replace(redirectPath)
      return
    }

    // If user is not authenticated and on protected routes, redirect to login
    if (!isAuthenticated && isProtectedRoute(currentPath)) {
      storeRedirectPath(currentPath)
      router.replace(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(currentPath)}`)
      return
    }
  }, [isAuthenticated, isInitialized, isLoading, pathname, router])

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          return { success: false, error: error.message }
        }

        if (data.user) {
          // The auth state change listener will handle setting the user
          return { success: true }
        }

        return { success: false, error: "Sign in failed" }
      } catch (error) {
        console.error("Sign in error:", error)
        return { success: false, error: "An unexpected error occurred" }
      } finally {
        setIsLoading(false)
      }
    },
    [supabase],
  )

  const signUp = useCallback(
    async (email: string, password: string, username?: string, fullName?: string) => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              full_name: fullName,
            },
          },
        })

        if (error) {
          return { success: false, error: error.message }
        }

        if (data.user) {
          return { success: true }
        }

        return { success: false, error: "Sign up failed" }
      } catch (error) {
        console.error("Sign up error:", error)
        return { success: false, error: "An unexpected error occurred" }
      } finally {
        setIsLoading(false)
      }
    },
    [supabase],
  )

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true)
      clearStoredRedirectPath()
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Sign out error:", error)
      }

      setUser(null)
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const refreshUser = useCallback(async () => {
    if (!user) return

    try {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("tier, coins, full_name, username")
        .eq("id", user.id)
        .single()

      if (profile) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                tier: profile.tier || "grassroot",
                coins: profile.coins || 0,
                full_name: profile.full_name,
                username: profile.username,
              }
            : null,
        )
      }
    } catch (error) {
      console.error("Error refreshing user:", error)
    }
  }, [user, supabase])

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    signIn,
    signUp,
    signOut,
    refreshUser,
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
