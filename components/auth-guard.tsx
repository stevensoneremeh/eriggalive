"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything until mounted to prevent hydration issues
  if (!mounted) {
    return <>{children}</>
  }

  // Public routes that don't require auth
  const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/signup/success"]

  const isPublicRoute = publicRoutes.includes(pathname)

  // For now, just render children - auth logic can be added later
  return <>{children}</>
}
