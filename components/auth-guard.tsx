"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  fallback?: React.ReactNode
}

export function AuthGuard({ children, requireAuth = true, redirectTo = "/login", fallback }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && requireAuth && !isAuthenticated) {
      // Store current path for redirect after login
      sessionStorage.setItem("redirectAfterAuth", pathname)
      const loginUrl = `${redirectTo}?redirectTo=${encodeURIComponent(pathname)}`
      router.push(loginUrl)
    }
  }, [isAuthenticated, loading, requireAuth, redirectTo, pathname, router])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground text-center">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show fallback or redirect for unauthenticated users
  if (requireAuth && !isAuthenticated) {
    return fallback || null
  }

  // Show children if auth requirements are met
  return <>{children}</>
}
