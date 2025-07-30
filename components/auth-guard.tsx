"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

// Define which routes require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/profile",
  "/coins",
  "/premium",
  "/chat",
  "/community",
  "/mission",
  "/vault",
  "/tickets",
  "/merch",
  "/meet-greet",
]

// Define public routes that don't require auth
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password"]

export function AuthGuard({ children, requireAuth, redirectTo = "/login" }: AuthGuardProps) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Determine if current route requires auth
  const routeRequiresAuth = requireAuth ?? PROTECTED_ROUTES.some((route) => pathname.startsWith(route))

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/auth")

  useEffect(() => {
    // Don't redirect while loading
    if (loading) return

    // If route requires auth and user is not authenticated
    if (routeRequiresAuth && !isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname)
      router.push(`${redirectTo}?returnUrl=${returnUrl}`)
      return
    }

    // If user is authenticated and on auth pages, redirect to dashboard
    if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
      router.push("/dashboard")
      return
    }
  }, [loading, isAuthenticated, routeRequiresAuth, pathname, router, redirectTo])

  // Show loading skeleton while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }

  // If route requires auth and user is not authenticated, don't render
  if (routeRequiresAuth && !isAuthenticated) {
    return null
  }

  return <>{children}</>
}
