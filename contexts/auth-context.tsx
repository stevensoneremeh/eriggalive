"use client"

import type React from "react"
import { createContext, useState, useEffect, useContext, type ReactNode } from "react"
import { simpleAuthService } from "@/lib/auth/simple-auth-service"

interface User {
  id: string
  email: string
  name: string
  // Add other user properties as needed
}

interface AuthContextProps {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  validateSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  login: async () => ({ success: false, error: "Not implemented" }),
  logout: () => {},
  validateSession: async () => {},
})

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    validateSession()
  }, [])

  const login = async (email: string, password: string, rememberMe = false) => {
    try {
      setLoading(true)
      setError(null)

      const result = await simpleAuthService.login({
        email,
        password,
        rememberMe,
      })

      if (result.success && result.user && result.tokens) {
        setUser(result.user)
        setIsAuthenticated(true)

        // Store tokens
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", result.tokens.accessToken)
          localStorage.setItem("refreshToken", result.tokens.refreshToken)
          if (rememberMe) {
            localStorage.setItem("rememberMe", "true")
          }
        }

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
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("rememberMe")
    }
  }

  const validateSession = async () => {
    if (typeof window === "undefined") return

    const token = localStorage.getItem("accessToken")
    if (!token) return

    try {
      const result = await simpleAuthService.validateToken(token)
      if (result.success && result.user) {
        setUser(result.user)
        setIsAuthenticated(true)
      } else {
        // Try to refresh token
        const refreshToken = localStorage.getItem("refreshToken")
        if (refreshToken) {
          const refreshResult = await simpleAuthService.refreshToken(refreshToken)
          if (refreshResult.success && refreshResult.tokens) {
            localStorage.setItem("accessToken", refreshResult.tokens.accessToken)
            setIsAuthenticated(true)
          } else {
            logout()
          }
        } else {
          logout()
        }
      }
    } catch (error) {
      console.error("Session validation error:", error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextProps = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    validateSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  return useContext(AuthContext)
}
