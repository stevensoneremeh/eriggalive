"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ResponsiveSidebar } from "./responsive-sidebar"
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, profile, isLoading, isAuthenticated, isInitialized, navigationManager } = useAuth()
  const [retryCount, setRetryCount] = useState(0)
  const [showRetry, setShowRetry] = useState(false)

  // Handle retry logic
  useEffect(() => {
    if (!isLoading && !isAuthenticated && isInitialized && retryCount < 3) {
      const timer = setTimeout(() => {
        setShowRetry(true)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isLoading, isAuthenticated, isInitialized, retryCount])

  // Handle authentication redirect
  useEffect(() => {
    if (isInitialized && !isAuthenticated && !isLoading) {
      // If user is not authenticated after initialization, redirect to login
      const timer = setTimeout(() => {
        if (navigationManager) {
          navigationManager.handleAuthRequiredNavigation(window.location.pathname)
        }
      }, 3000) // Give 3 seconds for any pending auth operations

      return () => clearTimeout(timer)
    }
  }, [isInitialized, isAuthenticated, isLoading, navigationManager])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    setShowRetry(false)

    // Attempt to refresh the page or re-initialize auth
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  // Loading state during initialization
  if (!isInitialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-lime-500" />
            <div className="text-center space-y-2">
              <h3 className="font-semibold">Loading your dashboard</h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we prepare your personalized experience...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state - not authenticated after initialization
  if (isInitialized && !isAuthenticated && !isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle>Authentication Required</CardTitle>
            </div>
            <CardDescription>You need to be signed in to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>Redirecting you to the login page in a few seconds...</AlertDescription>
            </Alert>

            {showRetry && (
              <div className="flex flex-col space-y-2">
                <p className="text-sm text-muted-foreground">Taking longer than expected?</p>
                <Button onClick={handleRetry} variant="outline" className="w-full" disabled={retryCount >= 3}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {retryCount >= 3 ? "Max retries reached" : "Retry"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state - missing user data
  if (isAuthenticated && (!user || !profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle>Profile Error</CardTitle>
            </div>
            <CardDescription>There was an issue loading your profile data</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>Your session appears to be corrupted. Please sign in again.</AlertDescription>
            </Alert>
            <Button onClick={() => (window.location.href = "/login")} className="w-full mt-4">
              Sign In Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state - render dashboard
  return (
    <div className="flex h-screen bg-background">
      <ResponsiveSidebar />
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">{children}</div>
        </div>
      </main>
    </div>
  )
}
