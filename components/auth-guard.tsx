"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function AuthGuard({ children, requireAuth = true, redirectTo = "/login" }: AuthGuardProps) {
  const { isAuthenticated, loading, isConfigured } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Don't redirect if still loading or not configured
    if (loading || !isConfigured) {
      return
    }

    // Only redirect if auth is required and user is not authenticated
    if (requireAuth && !isAuthenticated) {
      console.log("🔒 Auth required, redirecting to:", redirectTo)
      const currentPath = window.location.pathname
      const redirectUrl = `${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`
      router.push(redirectUrl)
    }
  }, [isAuthenticated, loading, requireAuth, redirectTo, router, isConfigured])

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show content if not configured (for development)
  if (!isConfigured) {
    return <>{children}</>
  }

  // Show content if auth not required or user is authenticated
  if (!requireAuth || isAuthenticated) {
    return <>{children}</>
  }

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Redirecting to login...</p>
      </div>
    </div>
  )
}
