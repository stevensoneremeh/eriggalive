"use client"

import type React from "react"
import { createContext, useState, useEffect, useContext, useCallback } from "react"
import { enhancedAuthService } from "@/lib/auth/enhanced-auth-service"
import { DeviceDetection } from "@/lib/auth/device-detection"
import { toast } from "@/components/ui/use-toast"

interface User {
  id: string
  email: string
  username: string
  fullName: string
  tier: string
  coins: number
  level: number
  points: number
  avatarUrl?: string
  isActive: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => ({ success: false }),
  logout: () => {},
  clearError: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = !!user

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for stored token
        const token = localStorage.getItem("auth_token")
        if (token) {
          const result = await enhancedAuthService.validateToken(token)
          if (result.success && result.user) {
            setUser(result.user)
          } else {
            localStorage.removeItem("auth_token")
            localStorage.removeItem("refresh_token")
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    try {
      setIsLoading(true)
      setError(null)

      const deviceInfo = DeviceDetection.getDeviceInfo()
      const result = await enhancedAuthService.login({
        email,
        password,
        rememberMe,
        deviceInfo,
        ipAddress: "client",
      })

      if (result.success && result.user && result.tokens) {
        setUser(result.user)

        // Store tokens
        localStorage.setItem("auth_token", result.tokens.accessToken)
        localStorage.setItem("refresh_token", result.tokens.refreshToken)

        if (rememberMe) {
          localStorage.setItem("remember_me", "true")
        }

        toast({
          title: "Welcome back!",
          description: `Successfully signed in as ${result.user.username}`,
        })

        return { success: true }
      } else {
        setError(result.error || "Login failed")
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setError(null)
    localStorage.removeItem("auth_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("remember_me")

    enhancedAuthService.logout()

    toast({
      title: "Signed out",
      description: "You have been successfully signed out",
    })
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
