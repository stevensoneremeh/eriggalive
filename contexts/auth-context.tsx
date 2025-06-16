"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

// Types
interface User {
  id: string
  email: string
  username?: string
  full_name?: string
  tier: "grassroot" | "pioneer" | "elder" | "blood"
  coins: number
  avatar_url?: string
  created_at: string
}

interface AuthContextType {
  user: User | null
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
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  const isAuthenticated = !!user

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we're in the browser
        if (typeof window === "undefined") {
          setIsInitialized(true)
          return
        }

        const token = localStorage.getItem("auth_token")
        if (!token) {
          setIsInitialized(true)
          return
        }

        // Validate token and get user data
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else {
          // Invalid token, remove it
          localStorage.removeItem("auth_token")
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        // Clear invalid token
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token")
        }
      } finally {
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_token", data.token)
        }
        return { success: true }
      } else {
        return { success: false, error: data.error || "Sign in failed" }
      }
    } catch (error) {
      console.error("Sign in error:", error)
      return { success: false, error: "Network error occurred" }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, username?: string, fullName?: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, username, full_name: fullName }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_token", data.token)
        }
        return { success: true }
      } else {
        return { success: false, error: data.error || "Sign up failed" }
      }
    } catch (error) {
      console.error("Sign up error:", error)
      return { success: false, error: "Network error occurred" }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      // Call sign out API
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""}`,
        },
      })
    } catch (error) {
      console.error("Sign out API error:", error)
    } finally {
      // Always clear local state
      setUser(null)
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token")
      }
      router.push("/")
    }
  }, [router])

  const refreshUser = useCallback(async () => {
    if (typeof window === "undefined") return

    const token = localStorage.getItem("auth_token")
    if (!token) return

    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error("Refresh user error:", error)
    }
  }, [])

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
