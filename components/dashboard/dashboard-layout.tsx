"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, isLoading, isAuthenticated, signOut } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md shadow-lg">
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

  // This state is mostly handled by middleware, but serves as a fallback.
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle>Authentication Required</CardTitle>
            </div>
            <CardDescription>You need to be signed in to access the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>Redirecting you to the login page...</AlertDescription>
            </Alert>
            <Button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/login"
                }
              }}
              className="w-full mt-4"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // This is a critical error state: user is authenticated but profile data is missing.
  if (isAuthenticated && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle>Profile Error</CardTitle>
            </div>
            <CardDescription>There was an issue loading your profile data.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>Your session might be out of sync. Please sign out and try again.</AlertDescription>
            </Alert>
            <Button onClick={signOut} className="w-full mt-4">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state: render dashboard content
  return (
    <div className="min-h-screen bg-background">
      <main className="w-full">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">{children}</div>
      </main>
    </div>
  )
}
