"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { SimpleLoading } from "@/components/simple-loading"

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ children, redirectTo = "/login" }: AuthGuardProps) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const currentPath = window.location.pathname
      const redirectUrl = `${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`
      router.push(redirectUrl)
    }
  }, [loading, isAuthenticated, router, redirectTo])

  if (loading) {
    return <SimpleLoading />
  }

  if (!isAuthenticated) {
    return <SimpleLoading />
  }

  return <>{children}</>
}
