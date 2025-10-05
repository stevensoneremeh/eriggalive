"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
<<<<<<< HEAD
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Loader2, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
=======
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react"
import Link from "next/link"
import { DynamicLogo } from "@/components/dynamic-logo"
>>>>>>> new

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
<<<<<<< HEAD
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
=======
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const { updatePassword } = useAuth()
>>>>>>> new
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
<<<<<<< HEAD
    // Handle the auth callback
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        setError("Invalid or expired reset link")
      }
    }

    handleAuthCallback()
  }, [])

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long"
    }
    return null
  }
=======
    // Check if we have the required tokens from the URL
    const accessToken = searchParams.get("access_token")
    const refreshToken = searchParams.get("refresh_token")

    if (!accessToken || !refreshToken) {
      setError("Invalid or expired reset link. Please request a new password reset.")
    }
  }, [searchParams])
>>>>>>> new

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

<<<<<<< HEAD
    // Validate passwords
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      setLoading(false)
      return
    }

=======
>>>>>>> new
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

<<<<<<< HEAD
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

=======
    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    try {
      const { error } = await updatePassword(password)
>>>>>>> new
      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setTimeout(() => {
<<<<<<< HEAD
          router.push("/auth/login")
        }, 3000)
      }
    } catch (error) {
      setError("An unexpected error occurred")
    }

    setLoading(false)
=======
          router.push("/login")
        }, 3000)
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
>>>>>>> new
  }

  if (success) {
    return (
<<<<<<< HEAD
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold">Password Updated!</CardTitle>
            <CardDescription>
              Your password has been successfully updated. You will be redirected to the login page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/login">Go to Login</Link>
=======
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <DynamicLogo className="h-12 w-auto" />
            </div>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">Password Updated!</CardTitle>
            <CardDescription>Your password has been successfully updated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300 text-center">
                Redirecting you to login page in a few seconds...
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/login">Continue to Login</Link>
>>>>>>> new
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
<<<<<<< HEAD
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
=======
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <DynamicLogo className="h-12 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
>>>>>>> new
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
<<<<<<< HEAD
              <p className="text-xs text-gray-500">Must be at least 6 characters long</p>
            </div>

=======
            </div>
>>>>>>> new
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
<<<<<<< HEAD
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
=======
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                "Update Password"
              )}
>>>>>>> new
            </Button>
          </form>

          <div className="mt-6 text-center">
<<<<<<< HEAD
            <Link href="/auth/login" className="text-sm text-blue-600 hover:text-blue-500">
=======
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
            >
>>>>>>> new
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
