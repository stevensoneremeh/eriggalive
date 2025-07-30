"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { SimpleLoading } from "@/components/simple-loading"

interface AuthGuardProps {
  children: React.ReactNode
}

const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/signup/success"]

const adminRoutes = ["/admin"]

export function AuthGuard({ children }: AuthGuardProps) {
  const [mounted, setMounted] = useState(false)
  const { user, profile, isLoading, isAuthenticated } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || isLoading) return

    const isPublicRoute = publicRoutes.includes(pathname)
    const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))

    // Redirect to login if not authenticated and trying to access protected route
    if (!isAuthenticated && !isPublicRoute) {
      router.push("/login")
      return
    }

    // Redirect to home if authenticated and trying to access auth pages
    if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
      router.push("/")
      return
    }

    // Check admin access
    if (isAdminRoute && (!profile || profile.subscription_tier !== "admin")) {
      router.push("/")
      return
    }
  }, [mounted, isLoading, isAuthenticated, pathname, router, profile])

  // Don't render anything until mounted
  if (!mounted) {
    return <SimpleLoading />
  }

  // Show loading while checking auth
  if (isLoading) {
    return <SimpleLoading />
  }

  return <>{children}</>
}
