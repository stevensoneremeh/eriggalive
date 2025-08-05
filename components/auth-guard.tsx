"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function AuthGuard({ children, requireAuth = true, redirectTo = "/login" }: AuthGuardProps) {
  const { isAuthenticated, loading, user, isConfigured } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || loading || !isConfigured) return

    console.log("🛡️ AuthGuard check:", {
      requireAuth,
      isAuthenticated,
      user: user?.email,
      mounted,
      loading,
    })

    if (requireAuth && !isAuthenticated) {
      console.log("🚫 Access denied, redirecting to:", redirectTo)
      const currentPath = window.location.pathname
      const redirectUrl = `${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`
      router.push(redirectUrl)
      return
    }

    if (!requireAuth && isAuthenticated) {
      console.log("✅ User is authenticated, allowing access to public route")
    }

    if (requireAuth && isAuthenticated) {
      console.log("✅ User is authenticated, allowing access to protected route")
    }
  }, [isAuthenticated, loading, mounted, requireAuth, redirectTo, router, user, isConfigured])

  // Show loading while checking auth or if not configured
  if (!mounted || loading || !isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">{!isConfigured ? "Configuring..." : "Loading..."}</p>
        </div>
      </div>
    )
  }

  // If auth is required but user is not authenticated, show loading
  // (the redirect will happen in the useEffect)
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // If no auth is required and user is authenticated, still show content
  // If auth is required and user is authenticated, show content
  return <>{children}</>
}
