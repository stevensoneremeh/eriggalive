"use client"

import type React from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ children, fallback, redirectTo = "/login" }: AuthGuardProps) {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    if (isLoaded && !userId) {
      setShouldRedirect(true)
      // Small delay to prevent flash
      const timer = setTimeout(() => {
        router.push(redirectTo)
      }, 100)

      return () => clearTimeout(timer)
    } else {
      setShouldRedirect(false)
    }
  }, [userId, isLoaded, router, redirectTo])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (!userId || shouldRedirect) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Authentication Required</h2>
            <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mt-4"></div>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}
