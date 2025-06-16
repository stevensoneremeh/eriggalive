"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { enhancedAuthService } from "@/lib/auth/enhanced-auth-service"
import { SessionStorage } from "@/lib/auth/session-storage"
import { DeviceDetection } from "@/lib/auth/device-detection"
import { toast } from "@/components/ui/use-toast"

// Types
interface UserProfile {
  id: string
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

interface AuthState {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  sessionToken: string | null
  activeSessions: number
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  signOutAllDevices: () => Promise<void>
  refreshSession: () => Promise<void>
  clearError: () => void
  retryAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isInitialized: false,
    error: null,
    sessionToken: null,
    activeSessions: 0,
  })

  const router = useRouter()
  const pathname = usePathname()
  const initializationRef = useRef(false)
  const refreshTimeoutRef = useRef<NodeJS.Timeout>()

  // Stable update function
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState((prev) => {
      const hasChanges = Object.keys(updates).some((key) => {
        const typedKey = key as keyof AuthState
        return prev[typedKey] !== updates[typedKey]
      })

      if (!hasChanges) return prev
      return { ...prev, ...updates }
    })
  }, [])

  const clearError = useCallback(() => {
    updateState({ error: null })
  }, [updateState])

  // Initialize authentication
  useEffect(() => {
    if (initializationRef.current) return

    const initializeAuth = async () => {
      try {
        initializationRef.current = true

        // Check for stored session
        const storedSession = SessionStorage.getStoredSession()

        if (storedSession) {
          // Validate stored session
          const result = await enhancedAuthService.validateSession(storedSession.sessionToken)

          if (result.success && result.user) {
            updateState({
              user: result.user,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
              error: null,
              sessionToken: storedSession.sessionToken,
            })

            // Set up token refresh
            scheduleTokenRefresh(storedSession.refreshToken)

            // Get active sessions count
            const sessions = await enhancedAuthService.getUserSessions(result.user.id)
            updateState({ activeSessions: sessions.length })

            return
          } else {
            // Invalid session, clear storage
            SessionStorage.clearSession()
          }
        }

        // No valid session found
        updateState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
          error: null,
          sessionToken: null,
          activeSessions: 0,
        })
      } catch (error) {
        console.error("Auth initialization error:", error)
        updateState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
          error: error instanceof Error ? error.message : "Authentication failed",
          sessionToken: null,
          activeSessions: 0,
        })
      }
    }

    initializeAuth()
  }, [updateState])

  // Schedule token refresh
  const scheduleTokenRefresh = useCallback((refreshToken: string) => {
    // Clear existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    // Schedule refresh 5 minutes before expiry
    const refreshIn = 10 * 60 * 1000 // 10 minutes

    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await enhancedAuthService.refreshToken(refreshToken)

        if (result.success && result.tokens) {
          // Update stored session
          const storedSession = SessionStorage.getStoredSession()
          if (storedSession) {
            storedSession.expiresAt = new Date(Date.now() + result.tokens.expiresIn).toISOString()
            SessionStorage.storeSession(storedSession)
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
        updateState({ isLoading: true, error: null })

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
          // Store session
          SessionStorage.storeSession({
            sessionToken: result.session.sessionToken,
            refreshToken: result.tokens.refreshToken,
            expiresAt: result.session.expiresAt.toISOString(),
            rememberMe,
            user: result.user,
          })

          updateState({
            user: result.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            sessionToken: result.session.sessionToken,
          })

          // Schedule token refresh
          scheduleTokenRefresh(result.tokens.refreshToken)

          // Get active sessions count
          const sessions = await enhancedAuthService.getUserSessions(result.user.id)
          updateState({ activeSessions: sessions.length })

          toast({
            title: "Welcome back!",
            description: `Successfully signed in${rememberMe ? " (remembered)" : ""}`,
          })

          return { success: true }
        } else {
          updateState({ isLoading: false, error: result.error })
          return { success: false, error: result.error }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Sign in failed"
        updateState({ isLoading: false, error: errorMessage })
        return { success: false, error: errorMessage }
      }
    },
    [updateState, scheduleTokenRefresh],
  )

  // Sign out function
  const signOut = useCallback(async (): Promise<void> => {
    try {
      if (state.sessionToken && state.user) {
        await enhancedAuthService.logout(state.sessionToken, state.user.id)
      }

      // Clear stored session
      SessionStorage.clearSession()

      // Clear refresh timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }

      updateState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        sessionToken: null,
        activeSessions: 0,
      })

      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      })

      router.push("/login")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }, [state.sessionToken, state.user, updateState, router])

  // Sign out from all devices
  const signOutAllDevices = useCallback(async (): Promise<void> => {
    try {
      if (state.user) {
        await enhancedAuthService.logoutAllDevices(state.user.id)

        // Clear local session
        SessionStorage.clearSession()

        // Clear refresh timeout
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current)
        }

        updateState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          sessionToken: null,
          activeSessions: 0,
        })

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
  }, [state.user, updateState, router])

  // Refresh session
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const storedSession = SessionStorage.getStoredSession()
      if (storedSession && state.sessionToken) {
        const result = await enhancedAuthService.validateSession(state.sessionToken)

        if (result.success && result.user) {
          updateState({ user: result.user })

          // Get updated sessions count
          const sessions = await enhancedAuthService.getUserSessions(result.user.id)
          updateState({ activeSessions: sessions.length })
        }
      }
    } catch (error) {
      console.error("Session refresh error:", error)
    }
  }, [state.sessionToken, updateState])

  // Retry authentication
  const retryAuth = useCallback(async (): Promise<void> => {
    updateState({ isLoading: true, error: null })

    // Reset initialization flag
    initializationRef.current = false

    // Re-run initialization
    const storedSession = SessionStorage.getStoredSession()
    if (storedSession) {
      const result = await enhancedAuthService.validateSession(storedSession.sessionToken)

      if (result.success && result.user) {
        updateState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
          error: null,
          sessionToken: storedSession.sessionToken,
        })
      } else {
        SessionStorage.clearSession()
        updateState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
          error: null,
          sessionToken: null,
        })
      }
    } else {
      updateState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: null,
        sessionToken: null,
      })
    }
  }, [updateState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signOut,
    signOutAllDevices,
    refreshSession,
    clearError,
    retryAuth,
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
