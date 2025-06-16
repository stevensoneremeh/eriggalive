"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getRedirectPath, ROUTES } from "@/lib/navigation-utils"

interface LoginPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [redirectPath, setRedirectPath] = useState(ROUTES.DASHBOARD)

  const router = useRouter()
  const { signIn, isAuthenticated, isLoading, isInitialized } = useAuth()

  // Set redirect path after component mounts to avoid SSR issues
  useEffect(() => {
    // Convert searchParams to URLSearchParams-like object for getRedirectPath
    const searchParamsObj = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
      if (typeof value === 'string') {
        searchParamsObj.set(key, value)
      } else if (Array.isArray(value)) {
        searchParamsObj.set(key, value[0] || '')
      }
    })
    setRedirectPath(getRedirectPath(searchParamsObj))
  }, [searchParams])

  // Handle already authenticated users
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      // Show success message briefly before redirecting
      setShowSuccess(true)

      const timer = setTimeout(() => {
        router.replace(redirectPath)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, isInitialized, router, redirectPath])

  // Show loading state during initialization
  if (!isInitialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-lime-500/20">
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-lime-500" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show success state for already authenticated users
  if (showSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-lime-500/20">
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <p className="text-sm text-muted-foreground">Already signed in! Redirecting...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Basic validation
      if (!email?.trim() || !password?.trim()) {
        setError("Please enter both email and password")
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        setError("Please enter a valid email address")
        return
      }

      const result = await signIn(email.trim(), password)

      if (result.success) {
        // Success is handled by the auth context and useEffect above
        setShowSuccess(true)
      } else {
        setError(result.error || "Failed to sign in. Please check your credentials.")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <Card className="w-full max-w-md border-lime-500/20 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">Sign in to access your Erigga fan account</CardDescription>
          {redirectPath !== ROUTES.DASHBOARD && (
            <div className="text-xs text-center text-muted-foreground bg-muted/50 rounded-md p-2">
              You'll be redirected to your requested page after signing in
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="border-lime-500/20 focus:border-lime-500"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-lime-500 hover:underline focus:underline focus:outline-none"
                  tabIndex={isSubmitting ? -1 : 0}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="border-lime-500/20 focus:border-lime-500"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-lime-500 hover:bg-lime-600 text-teal-900 font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-lime-500 hover:underline focus:underline focus:outline-none"
              tabIndex={isSubmitting ? -1 : 0}
            >
              Sign up here
            </Link>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="hover:underline focus:underline focus:outline-none">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="hover:underline focus:underline focus:outline-none">
              Privacy Policy
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}