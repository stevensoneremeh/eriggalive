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
const PROTECTED_ROUTES = ["/dashboard", "/profile", "/coins", "/chat", "/community", "/mission", "/premium", "/admin"]

// Define public routes that don't require auth
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password"]

export function AuthGuard({ children, requireAuth, redirectTo = "/login" }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Determine if current route requires auth
  const routeRequiresAuth = requireAuth ?? PROTECTED_ROUTES.some((route) => pathname.startsWith(route))

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || (route === "/" && pathname === "/"))

  useEffect(() => {
    if (loading) return

    // If route requires auth and user is not authenticated
    if (routeRequiresAuth && !user) {
      const returnUrl = encodeURIComponent(pathname)
      router.push(`${redirectTo}?returnUrl=${returnUrl}`)
      return
    }

    // If user is authenticated and on auth pages, redirect to dashboard
    if (user && (pathname === "/login" || pathname === "/signup")) {
      router.push("/dashboard")
      return
    }
  }, [user, loading, routeRequiresAuth, pathname, router, redirectTo])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    )
  }

  // If route requires auth and user is not authenticated, don't render
  if (routeRequiresAuth && !user) {
    return null
  }

  // Render children for all other cases
  return <>{children}</>
}
