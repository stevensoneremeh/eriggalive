"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, AlertTriangle, Loader2 } from "lucide-react"

interface AdminGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { user, profile, isLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user || isLoading) return

      try {
        setChecking(true)
        const response = await fetch("/api/admin/check", {
          headers: {
            Authorization: `Bearer ${user.access_token}`,
          },
        })

        const result = await response.json()
        setIsAdmin(result.isAdmin)
      } catch (error) {
        console.error("Admin check failed:", error)
        setIsAdmin(false)
      } finally {
        setChecking(false)
      }
    }

    checkAdminStatus()
  }, [user, profile, isLoading])

  if (isLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
            <p className="text-white">Verifying admin access...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
            <p className="text-gray-300">Please log in to access the admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
              <p className="text-gray-300">You don't have permission to access the admin dashboard.</p>
              <p className="text-sm text-gray-400 mt-2">
                Contact the system administrator if you believe this is an error.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    )
  }

  return <>{children}</>
}
