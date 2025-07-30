"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { SimpleLoading } from "@/components/simple-loading"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [mounted, setMounted] = useState(false)
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || isLoading) return

    // Define public routes that don't require authentication
    const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/mission", "/radio"]

    // Check if current route is public
    const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route))

    // If user is not authenticated and trying to access protected route
    if (!user && !isPublicRoute) {
      router.push("/login")
      return
    }

    // If user is authenticated and trying to access auth pages, redirect to home
    if (user && ["/login", "/signup"].includes(pathname)) {
      router.push("/")
      return
    }
  }, [user, pathname, router, mounted, isLoading])

  // Don't render anything until mounted to prevent hydration issues
  if (!mounted) {
    return <>{children}</>
  }

  // Show loading while checking authentication
  if (isLoading) {
    return <SimpleLoading />
  }

  return <>{children}</>
}
