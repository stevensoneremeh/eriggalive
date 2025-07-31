"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ children, redirectTo = "/login" }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated
  if (!user) {
    return null
  }

  // User is authenticated, render children
  return <>{children}</>
}
