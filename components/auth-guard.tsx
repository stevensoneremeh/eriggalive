"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Lock, User } from "lucide-react"
import Link from "next/link"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
  requireAuth?: boolean
}

// Define which routes require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/vault",
  "/coins",
  "/merch",
  "/profile",
  "/meet-greet",
  "/admin",
  "/premium",
  "/tickets",
]

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/community",
  "/mission",
  "/radio",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
]

export function AuthGuard({ children, fallback, redirectTo = "/login", requireAuth }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Determine if current route requires authentication
  const routeRequiresAuth =
    requireAuth !== undefined ? requireAuth : PROTECTED_ROUTES.some((route) => pathname.startsWith(route))

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route))

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return

    // If route requires auth and user is not authenticated
    if (routeRequiresAuth && !isAuthenticated) {
      const currentUrl = encodeURIComponent(pathname)
      const loginUrl = `${redirectTo}?redirect=${currentUrl}`

      // Add a small delay to prevent flash of content
      const timer = setTimeout(() => {
        router.push(loginUrl)
      }, 100)

      return () => clearTimeout(timer)
    }

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, isLoading, routeRequiresAuth, pathname, router, redirectTo])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading...</h3>
            <p className="text-sm text-muted-foreground text-center">Checking your authentication status</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If route requires auth and user is not authenticated, show auth required message
  if (routeRequiresAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Authentication Required</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              You need to be signed in to access this page. Please log in to continue.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button asChild className="flex-1">
                <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1 bg-transparent">
                <Link href="/signup">Create Account</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">Redirecting to login page...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // For public routes or authenticated users, render children
  return <>{children}</>
}
