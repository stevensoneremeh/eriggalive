"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { enhancedAuthService } from "@/lib/auth/enhanced-auth-service"
import { SessionStorage } from "@/lib/auth/session-storage"
import { DeviceDetection } from "@/lib/auth/device-detection"
import { toast } from "@/components/ui/use-toast"

interface User {
  id: number
  email: string
  username: string
  fullName: string
  tier: "grassroot" | "pioneer" | "elder" | "blood_brotherhood" | "admin"
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
  isInitialized: boolean
  error: string | null
  activeSessions: number
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  signOutAllDevices: () => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
  retryAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSessions, setActiveSessions] = useState(0)

  const router = useRouter()
  const pathname = usePathname()
  const initializationRef = useRef(false)
  const refreshTimeoutRef = useRef<NodeJS.Timeout>()

  const isAuthenticated = !!user

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Initialize authentication
  const initializeAuth = useCallback(async () => {
    if (initializationRef.current) return

    try {
      initializationRef.current = true
      setIsLoading(true)

      const storedSession = SessionStorage.getSession()
      if (!storedSession) {
        setIsLoading(false)
        setIsInitialized(true)
        return
      }

      // Validate session with server
      const result = await enhancedAuthService.validateSession(storedSession.sessionToken)

      if (result.success && result.user) {
        setUser(result.user)
        setError(null)

        // Update stored session
        SessionStorage.updateSession({
          user: result.user,
          expiresAt: result.session?.expiresAt?.toISOString() || storedSession.expiresAt,
        })

        // Schedule token refresh
        scheduleTokenRefresh(storedSession.refreshToken)

        // Get active sessions count
        try {
          const sessions = await enhancedAuthService.getUserSessions(result.user.id.toString())
          setActiveSessions(sessions.length)
        } catch (error) {
          console.error("Failed to get sessions count:", error)
        }
      } else {
        // Invalid session, clear storage
        SessionStorage.clearSession()
        setUser(null)
        setError(result.error || null)
      }
    } catch (error) {
      console.error("Auth initialization error:", error)
      SessionStorage.clearSession()
      setUser(null)
      setError(error instanceof Error ? error.message : "Authentication failed")
    } finally {
      setIsLoading(false)
      setIsInitialized(true)
    }
  }, [])

  // Schedule token refresh
  const scheduleTokenRefresh = useCallback((refreshToken: string) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    // Refresh token 5 minutes before expiry
    const refreshIn = 10 * 60 * 1000 // 10 minutes

    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await enhancedAuthService.refreshToken(refreshToken)

        if (result.success && result.tokens) {
          // Update stored session
          const storedSession = SessionStorage.getSession()
          if (storedSession) {
            SessionStorage.updateSession({
              refreshToken: result.tokens.refreshToken,
              expiresAt: new Date(Date.now() + result.tokens.expiresIn).toISOString(),
            })
          }

          // Schedule next refresh
          scheduleTokenRefresh(result.tokens.refreshToken)
        } else {
          // Refresh failed, sign out
          await signOut()
        }
      } catch (error) {
        console.error("Token refresh error:", error)
        await signOut()
      }
    }, refreshIn)
  }, [])

  // Sign in function
  const signIn = useCallback(
    async (email: string, password: string, rememberMe = false): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsLoading(true)
        setError(null)

        const deviceInfo = DeviceDetection.getDeviceInfo()
        const ipAddress = DeviceDetection.getClientIP()

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

          // Schedule token refresh
          scheduleTokenRefresh(result.tokens.refreshToken)

          // Get active sessions count
          try {
            const sessions = await enhancedAuthService.getUserSessions(result.user.id.toString())
            setActiveSessions(sessions.length)
          } catch (error) {
            console.error("Failed to get sessions count:", error)
          }

          toast({
            title: "Welcome back!",
            description: `Successfully signed in${rememberMe ? " and will be remembered" : ""}`,
          })

          return { success: true }
        } else {
          setError(result.error || "Sign in failed")
          return { success: false, error: result.error }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Sign in failed"
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [scheduleTokenRefresh],
  )

  // Sign out function
  const signOut = useCallback(async (): Promise<void> => {
    try {
      const storedSession = SessionStorage.getSession()
      if (storedSession && user) {
        await enhancedAuthService.logout(storedSession.sessionToken, user.id.toString())
      }
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      // Clear stored session
      SessionStorage.clearSession()

      // Clear refresh timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }

      setUser(null)
      setError(null)
      setActiveSessions(0)

      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      })

      router.push("/login")
    }
  }, [user, router])

  // Sign out from all devices
  const signOutAllDevices = useCallback(async (): Promise<void> => {
    try {
      if (user) {
        await enhancedAuthService.logoutAllDevices(user.id.toString())

        // Clear local session
        SessionStorage.clearSession()

        // Clear refresh timeout
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current)
        }

        setUser(null)
        setError(null)
        setActiveSessions(0)

        toast({
          title: "Signed out from all devices",
          description: "All your sessions have been terminated",
        })

        router.push("/login")
      }
    } catch (error) {
      console.error("Sign out all devices error:", error)
      toast({
        title: "Error",
        description: "Failed to sign out from all devices",
        variant: "destructive",
      })
    }
  }, [user, router])

  // Refresh user data
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const storedSession = SessionStorage.getSession()
      if (!storedSession) return

      const result = await enhancedAuthService.validateSession(storedSession.sessionToken)

      if (result.success && result.user) {
        setUser(result.user)
        SessionStorage.updateSession({ user: result.user })

        // Update sessions count
        try {
          const sessions = await enhancedAuthService.getUserSessions(result.user.id.toString())
          setActiveSessions(sessions.length)
        } catch (error) {
          console.error("Failed to get sessions count:", error)
        }
      } else {
        await signOut()
      }
    } catch (error) {
      console.error("Refresh user error:", error)
      await signOut()
    }
  }, [signOut])

  // Retry authentication
  const retryAuth = useCallback(async (): Promise<void> => {
    initializationRef.current = false
    setError(null)
    await initializeAuth()
  }, [initializeAuth])

  // Initialize on mount
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  // Auto-refresh user data periodically
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(refreshUser, 5 * 60 * 1000) // Every 5 minutes

    return () => clearInterval(interval)
  }, [isAuthenticated, refreshUser])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isInitialized,
    error,
    activeSessions,
    signIn,
    signOut,
    signOutAllDevices,
    refreshUser,
    clearError,
    retryAuth,
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
