"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { toast } from "@/components/ui/use-toast"

// Types
interface UserProfile {
  id: string
  auth_user_id: string
  username: string
  full_name: string
  email: string
  avatar_url?: string
  tier: "grassroot" | "pioneer" | "elder" | "blood_brotherhood" | "admin"
  coins: number
  level: number
  points: number
  is_active: boolean
  is_banned: boolean
  created_at: string
  updated_at: string
  last_login?: string
  login_count: number
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (
    email: string,
    password: string,
    userData: { username: string; full_name: string },
  ) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Constants
const PROFILE_CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isAuthenticated: false,
    isLoading: true,
    isInitialized: false,
    error: null,
  })

  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const initializationRef = useRef(false)
  const profileCacheRef = useRef<{ data: UserProfile | null; timestamp: number }>({
    data: null,
    timestamp: 0,
  })

  // Stable update function to prevent infinite renders
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState((prev) => {
      // Only update if there are actual changes
      const hasChanges = Object.keys(updates).some((key) => {
        const typedKey = key as keyof AuthState
        return prev[typedKey] !== updates[typedKey]
      })

      if (!hasChanges) {
        return prev
      }

      return { ...prev, ...updates }
    })
  }, [])

  const clearError = useCallback(() => {
    updateState({ error: null })
  }, [updateState])

  // Enhanced profile fetching with caching
  const fetchProfile = useCallback(
    async (userId: string, forceRefresh = false): Promise<UserProfile | null> => {
      try {
        // Check cache first
        const now = Date.now()
        const cached = profileCacheRef.current
        if (!forceRefresh && cached.data && now - cached.timestamp < PROFILE_CACHE_DURATION) {
          return cached.data
        }

        const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).single()

        if (error) {
          console.error("Profile fetch error:", error)
          throw new Error(`Failed to fetch user profile: ${error.message}`)
        }

        if (!data) {
          throw new Error("User profile not found")
        }

        // Update cache
        profileCacheRef.current = {
          data: data as UserProfile,
          timestamp: now,
        }

        return data as UserProfile
      } catch (error) {
        console.error("Error fetching profile:", error)
        return null
      }
    },
    [supabase],
  )

  // Initialize auth - only run once
  useEffect(() => {
    if (initializationRef.current) return

    const initializeAuth = async () => {
      try {
        initializationRef.current = true

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Session error:", error)
          updateState({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
            error: error.message,
          })
          return
        }

        if (session?.user) {
          const profile = await fetchProfile(session.user.id)

          if (profile && profile.is_active && !profile.is_banned) {
            updateState({
              user: session.user,
              profile,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
              error: null,
            })
          } else {
            await supabase.auth.signOut()
            updateState({
              user: null,
              profile: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
              error: profile ? "Account is inactive or banned" : "Failed to load profile",
            })
          }
        } else {
          updateState({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
            error: null,
          })
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        updateState({
          user: null,
          profile: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
          error: error instanceof Error ? error.message : "Authentication failed",
        })
      }
    }

    initializeAuth()
  }, [supabase, fetchProfile, updateState])

  // Set up auth state listener - stable dependencies
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event)

      switch (event) {
        case "SIGNED_IN":
          if (session?.user) {
            const profile = await fetchProfile(session.user.id, true)
            if (profile && profile.is_active && !profile.is_banned) {
              updateState({
                user: session.user,
                profile,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              })
            } else {
              await supabase.auth.signOut()
            }
          }
          break

        case "SIGNED_OUT":
          profileCacheRef.current = { data: null, timestamp: 0 }
          updateState({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
          break

        case "TOKEN_REFRESHED":
          // Session refreshed, no action needed
          break
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile, updateState])

  // Sign in function
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        updateState({ isLoading: true, error: null })

        if (!email || !password) {
          throw new Error("Email and password are required")
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new Error("Please enter a valid email address")
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
          let errorMessage = "Sign in failed"
          switch (error.message) {
            case "Invalid login credentials":
              errorMessage = "Invalid email or password"
              break
            case "Email not confirmed":
              errorMessage = "Please verify your email address"
              break
            case "Too many requests":
              errorMessage = "Too many login attempts. Please try again later"
              break
            default:
              errorMessage = error.message || "Sign in failed"
          }
          throw new Error(errorMessage)
        }

        if (!data.user) {
          throw new Error("Sign in failed - no user data received")
        }

        // Profile will be fetched by the auth state change listener
        toast({
          title: "Welcome back!",
          description: "Successfully signed in",
        })

        return { success: true }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Sign in failed"
        updateState({ isLoading: false, error: errorMessage })

        toast({
          title: "Sign in failed",
          description: errorMessage,
          variant: "destructive",
        })

        return { success: false, error: errorMessage }
      }
    },
    [supabase, updateState],
  )

  // Sign up function
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      userData: { username: string; full_name: string },
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        updateState({ isLoading: true, error: null })

        if (!email || !password || !userData.username || !userData.full_name) {
          throw new Error("All fields are required")
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new Error("Please enter a valid email address")
        }

        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long")
        }

        if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
          throw new Error("Username can only contain letters, numbers, and underscores")
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: userData,
          },
        })

        if (error) {
          throw new Error(error.message || "Sign up failed")
        }

        updateState({ isLoading: false })

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account",
        })

        return { success: true }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Sign up failed"
        updateState({ isLoading: false, error: errorMessage })

        toast({
          title: "Sign up failed",
          description: errorMessage,
          variant: "destructive",
        })

        return { success: false, error: errorMessage }
      }
    },
    [supabase, updateState],
  )

  // Sign out function
  const signOut = useCallback(async (): Promise<void> => {
    try {
      updateState({ isLoading: true })
      await supabase.auth.signOut()

      // Clear cache
      profileCacheRef.current = { data: null, timestamp: 0 }

      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      })

      router.push("/login")
    } catch (error) {
      console.error("Sign out error:", error)
      updateState({ isLoading: false })
    }
  }, [supabase, router, updateState])

  // Profile refresh
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (state.user?.id) {
      const profile = await fetchProfile(state.user.id, true)
      if (profile) {
        updateState({ profile })
      }
    }
  }, [state.user?.id, fetchProfile, updateState])

  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    clearError,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
