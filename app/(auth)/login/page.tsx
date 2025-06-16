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
import { Eye, EyeOff, AlertCircle, Loader2, Shield, Smartphone } from "lucide-react"
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

  // Get redirect path
  const redirectPath = searchParams?.get("redirect") || "/dashboard"

  // Handle mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect if already authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated && mounted) {
      router.push(redirectPath)
    }
  }, [isAuthenticated, isInitialized, mounted, router, redirectPath])

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
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters"
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
                className={`border-lime-500/20 ${formErrors.email ? "border-red-500" : ""}`}
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-lime-500 hover:underline" tabIndex={-1}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange("password")}
                  disabled={isSubmitting || authLoading}
                  className={`border-lime-500/20 pr-10 ${formErrors.password ? "border-red-500" : ""}`}
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
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
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
              <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                <Shield className="h-3 w-3" />
                Remember me for 30 days
              </Label>
            </div>

            {/* General Error */}
            {formErrors.general && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formErrors.general}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-lime-500 hover:bg-lime-600 text-teal-900 font-medium"
              disabled={isSubmitting || authLoading}
            >
              {isSubmitting || authLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
            <Link href="/signup" className="text-lime-500 hover:underline font-medium">
              Sign up
            </Link>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
