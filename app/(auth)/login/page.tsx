"use client"

import type React from "react"

<<<<<<< HEAD
import { useState, useEffect } from "react"
=======
import { useState } from "react"
>>>>>>> new
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
<<<<<<< HEAD
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
=======
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
>>>>>>> new

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
<<<<<<< HEAD
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const { signIn, isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && isAuthenticated && !authLoading) {
      const redirectTo = searchParams.get("redirectTo") || "/dashboard"
      router.push(redirectTo)
    }
  }, [isAuthenticated, authLoading, mounted, router, searchParams])
=======
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()
>>>>>>> new

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
<<<<<<< HEAD
    setLoading(true)
=======
    setIsLoading(true)
>>>>>>> new

    try {
      const { error } = await signIn(email, password)

      if (error) {
<<<<<<< HEAD
        setError(error.message || "Failed to sign in")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
=======
        setError(error.message || "Invalid email or password")
      } else {
        // Success - the auth context will handle the redirect
        router.push("/dashboard")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-10" />

      <Card className="w-full max-w-md relative z-10 bg-black/40 backdrop-blur-xl border-purple-500/20">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-gray-300">Sign in to your EriggaLive account</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert className="border-red-500/20 bg-red-500/10">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
>>>>>>> new
              </Alert>
            )}

            <div className="space-y-2">
<<<<<<< HEAD
              <Label htmlFor="email">Email</Label>
=======
              <Label htmlFor="email" className="text-gray-200">
                Email
              </Label>
>>>>>>> new
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
<<<<<<< HEAD
                disabled={loading}
=======
                className="bg-black/20 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400"
>>>>>>> new
              />
            </div>

            <div className="space-y-2">
<<<<<<< HEAD
              <Label htmlFor="password">Password</Label>
=======
              <Label htmlFor="password" className="text-gray-200">
                Password
              </Label>
>>>>>>> new
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
<<<<<<< HEAD
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
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
=======
                  className="bg-black/20 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link href="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                Forgot password?
              </Link>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
>>>>>>> new
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
<<<<<<< HEAD
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link href="/forgot-password" className="text-primary hover:underline">
              Forgot your password?
            </Link>
          </div>

          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardContent>
=======
                "Sign In"
              )}
            </Button>

            <p className="text-center text-sm text-gray-300">
              Don't have an account?{" "}
              <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
>>>>>>> new
      </Card>
    </div>
  )
}
