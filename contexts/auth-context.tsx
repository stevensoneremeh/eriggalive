"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { enhancedAuthService } from "@/lib/auth/enhanced-auth-service"
import { SessionStorage } from "@/lib/auth/session-storage"
import { DeviceDetection } from "@/lib/auth/device-detection"

interface User {
  id: number
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
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  logoutAllDevices: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true)

      const storedSession = SessionStorage.getSession()
      if (!storedSession) {
        setIsLoading(false)
        return
      }

      // Validate session with server
      const result = await enhancedAuthService.validateSession(storedSession.sessionToken)

      if (result.success && result.user) {
        setUser(result.user)

        // Update stored session with fresh data
        SessionStorage.updateSession({
          user: result.user,
          expiresAt: result.session?.expiresAt?.toISOString() || storedSession.expiresAt,
        })
      } else {
        // Invalid session, clear storage
        SessionStorage.clearSession()
        setUser(null)
      }
    } catch (error) {
      console.error("Auth initialization error:", error)
      SessionStorage.clearSession()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Login function
  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    try {
      setIsLoading(true)

      const deviceInfo = DeviceDetection.getDeviceInfo()
      const ipAddress = "client" // Will be determined server-side

      const result = await enhancedAuthService.login({
        email,
        password,
        rememberMe,
        deviceInfo,
        ipAddress,
      })

      if (result.success && result.user && result.tokens && result.session) {
        setUser(result.user)

        // Store session
        SessionStorage.saveSession({
          sessionToken: result.session.sessionToken,
          refreshToken: result.tokens.refreshToken,
          expiresAt: result.session.expiresAt.toISOString(),
          rememberMe: result.session.rememberMe,
          user: result.user,
        })

        return { success: true }
      } else {
        return { success: false, error: result.error || "Login failed" }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Login failed" }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    try {
      const storedSession = SessionStorage.getSession()
      if (storedSession) {
        await enhancedAuthService.logout(storedSession.sessionToken, user?.id.toString())
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      SessionStorage.clearSession()
      setUser(null)
    }
  }, [user])

  // Logout all devices
  const logoutAllDevices = useCallback(async () => {
    try {
      if (user) {
        await enhancedAuthService.logoutAllDevices(user.id.toString())
      }
    } catch (error) {
      console.error("Logout all devices error:", error)
    } finally {
      SessionStorage.clearSession()
      setUser(null)
    }
  }, [user])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const storedSession = SessionStorage.getSession()
      if (!storedSession) return

      const result = await enhancedAuthService.validateSession(storedSession.sessionToken)

      if (result.success && result.user) {
        setUser(result.user)
        SessionStorage.updateSession({ user: result.user })
      } else {
        await logout()
      }
    } catch (error) {
      console.error("Refresh user error:", error)
      await logout()
    }
  }, [logout])

  // Auto-refresh token
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(
      async () => {
        try {
          const storedSession = SessionStorage.getSession()
          if (!storedSession) return

          const result = await enhancedAuthService.refreshToken(storedSession.refreshToken)

          if (result.success && result.tokens) {
            // Update stored tokens
            SessionStorage.updateSession({
              refreshToken: result.tokens.refreshToken,
            })
          }
        } catch (error) {
          console.error("Auto-refresh error:", error)
        }
      },
      14 * 60 * 1000,
    ) // Refresh every 14 minutes

    return () => clearInterval(interval)
  }, [isAuthenticated])

  // Initialize on mount
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    logoutAllDevices,
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
