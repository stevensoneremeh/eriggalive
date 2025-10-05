"use client"

<<<<<<< HEAD
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
=======
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ children, fallback, redirectTo = "/login" }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      setShouldRedirect(true)
      // Get current path to redirect back after login
      const currentPath = window.location.pathname + window.location.search
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
      
      // Small delay to prevent flash
      const timer = setTimeout(() => {
        router.push(redirectUrl)
      }, 100)

      return () => clearTimeout(timer)
    } else {
      setShouldRedirect(false)
    }
  }, [user, loading, router, redirectTo])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
>>>>>>> new
      </div>
    )
  }

<<<<<<< HEAD
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
=======
  if (!user || shouldRedirect) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mt-4"></div>
        </div>
      </div>
    )
  }

  return <>{children}</>
>>>>>>> new
}
