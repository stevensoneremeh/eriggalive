"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"
import { Eye, EyeOff, AlertCircle, Loader2, Shield, Smartphone, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface FormData {
  email: string
  password: string
  rememberMe: boolean
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    signIn,
    isAuthenticated,
    isLoading: authLoading,
    isInitialized,
    error: authError,
    clearError,
    retryAuth,
    activeSessions,
  } = useAuth()

  // Get redirect path and error parameters
  const redirectPath = searchParams?.get("redirect") || "/dashboard"
  const errorParam = searchParams?.get("error")

  // Handle mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle URL error parameters
  useEffect(() => {
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        auth_error: "Authentication failed. Please try again.",
        profile_not_found: "User profile not found. Please contact support.",
        account_inactive: "Your account is inactive or banned. Please contact support.",
        session_expired: "Your session has expired. Please sign in again.",
        access_denied: "Access denied. Insufficient permissions.",
      }

      setFormErrors({ general: errorMessages[errorParam] || "An error occurred. Please try again." })
    }
  }, [errorParam])

  // Redirect if already authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated && mounted) {
      const finalRedirect = searchParams?.get("redirect") || "/dashboard"
      router.push(finalRedirect)
    }
  }, [isAuthenticated, isInitialized, mounted, router, searchParams])

  // Clear errors when auth error changes
  useEffect(() => {
    if (authError) {
      setFormErrors((prev) => ({ ...prev, general: authError }))
    } else {
      setFormErrors((prev) => ({ ...prev, general: undefined }))
    }
  }, [authError])

  // Form validation
  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {}

    if (!formData.email) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }

    if (!formData.password) {
      errors.password = "Password is required"
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData])

  // Handle input changes
  const handleInputChange = useCallback(
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = field === "rememberMe" ? e.target.checked : e.target.value
      setFormData((prev) => ({ ...prev, [field]: value }))

      // Clear field error when user starts typing
      if (formErrors[field as keyof FormErrors]) {
        setFormErrors((prev) => ({ ...prev, [field]: undefined }))
      }

      // Clear general error
      if (formErrors.general) {
        setFormErrors((prev) => ({ ...prev, general: undefined }))
        clearError()
      }
    },
    [formErrors, clearError],
  )

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateForm()) {
        return
      }

      setIsSubmitting(true)
      setFormErrors({})

      try {
        const result = await signIn(formData.email, formData.password, formData.rememberMe)

        if (result.success) {
          // Success is handled by the auth context and redirect effect
          toast({
            title: "Welcome back!",
            description: `You have been successfully signed in${formData.rememberMe ? " and will be remembered" : ""}`,
          })
        } else {
          setFormErrors({ general: result.error || "Sign in failed" })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
        setFormErrors({ general: errorMessage })
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, validateForm, signIn],
  )

  // Handle retry
  const handleRetry = useCallback(async () => {
    clearError()
    setFormErrors({})
    await retryAuth()
  }, [clearError, retryAuth])

  // Show loading skeleton while initializing
  if (!mounted || !isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-4 w-full" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <Card className="w-full max-w-md border-lime-500/20 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-lime-600 to-teal-600 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center">Sign in to your Erigga Fan Platform account</CardDescription>
          {activeSessions > 0 && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Smartphone className="h-3 w-3" />
              <span>
                {activeSessions} active session{activeSessions > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleInputChange("email")}
                disabled={isSubmitting || authLoading}
                className={formErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                autoComplete="email"
                autoFocus
              />
              {formErrors.email && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange("password")}
                  disabled={isSubmitting || authLoading}
                  className={formErrors.password ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting || authLoading}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {formErrors.password && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={formData.rememberMe}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, rememberMe: checked as boolean }))}
                disabled={isSubmitting || authLoading}
              />
              <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                Remember me for 30 days
              </Label>
            </div>

            {/* Error Alert */}
            {formErrors.general && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{formErrors.general}</span>
                  {authError && (
                    <Button variant="ghost" size="sm" onClick={handleRetry} className="h-auto p-1">
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-lime-600 to-teal-600 hover:from-lime-700 hover:to-teal-700"
              disabled={isSubmitting || authLoading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <div className="flex items-center justify-between w-full text-sm">
            <Link
              href="/forgot-password"
              className="text-lime-600 hover:text-lime-700 hover:underline"
              tabIndex={isSubmitting ? -1 : 0}
            >
              Forgot password?
            </Link>
            <Link
              href="/signup"
              className="text-lime-600 hover:text-lime-700 hover:underline"
              tabIndex={isSubmitting ? -1 : 0}
            >
              Create account
            </Link>
          </div>

          {redirectPath !== "/dashboard" && (
            <p className="text-xs text-muted-foreground text-center">
              You'll be redirected to {redirectPath} after signing in
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
