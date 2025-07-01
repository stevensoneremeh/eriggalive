"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Loading skeleton for the login page
function LoginPageSkeleton() {
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

// Component that uses useSearchParams - wrapped in its own Suspense
function LoginFormWithSearchParams() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [redirectPath, setRedirectPath] = useState("/dashboard")

  const router = useRouter()
  const { signIn, user, loading } = useAuth()
  const [searchParamsReady, setSearchParamsReady] = useState(false)

  useEffect(() => {
    if (!searchParamsReady) {
      setSearchParamsReady(true)
    }
  }, [searchParamsReady])

  // Set redirect path after component mounts and search params are ready
  useEffect(() => {
    if (searchParamsReady && user) {
      setShowSuccess(true)
      const timer = setTimeout(() => {
        router.replace(redirectPath)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [user, searchParamsReady, router, redirectPath])

  // Show loading state during initialization
  if (loading) {
    return <LoginPageSkeleton />
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
      if (!email?.trim() || !password?.trim()) {
        setError("Please enter both email and password")
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        setError("Please enter a valid email address")
        return
      }

      const result = await signIn(email.trim(), password)

      if (result.error) {
        setError(result.error?.message || "Failed to sign in. Please check your credentials.")
      } else {
        setShowSuccess(true)
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
          {redirectPath !== "/dashboard" && (
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="border-lime-500/20 focus:border-lime-500 pr-10"
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
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

// Main login page component with enhanced error boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginFormWithSearchParams />
    </Suspense>
  )
}
