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
}

export function AuthGuard({ children, requireAuth = true, redirectTo = "/login" }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        // Store current path for redirect after login
        const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(pathname)}`
        router.push(loginUrl)
      } else if (!requireAuth && isAuthenticated) {
        // Redirect authenticated users away from auth pages
        router.push("/dashboard")
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, pathname, router])

  // Show loading state
  if (isLoading) {
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

  // Show content if auth requirements are met
  if (requireAuth && isAuthenticated) {
    return <>{children}</>
  } else if (!requireAuth && !isAuthenticated) {
    return <>{children}</>
  }

  // Return null while redirecting
  return null
}
