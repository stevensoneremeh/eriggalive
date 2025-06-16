"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { SearchParamsWrapper } from "@/components/search-params-wrapper"
import Link from "next/link"

interface LoginFormContentProps {
  searchParams: URLSearchParams
}

function LoginFormContent({ searchParams }: LoginFormContentProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { signIn } = useAuth()
  const router = useRouter()

  const redirectPath = searchParams.get("redirect") || "/dashboard"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn(email, password)

      if (result.success) {
        // Redirect to intended destination
        router.push(redirectPath)
      } else {
        setError(result.error || "Sign in failed. Please try again.")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>

      <div className="text-center space-y-2">
        <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition-colors">
          Forgot your password?
        </Link>
        <div className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href={`/signup${redirectPath !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
            className="text-primary hover:underline"
          >
            Sign up
          </Link>
        </div>
      </div>
    </form>
  )
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-4 w-12 bg-muted rounded animate-pulse" />
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-16 bg-muted rounded animate-pulse" />
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
      </div>
      <div className="h-10 w-full bg-muted rounded animate-pulse" />
    </div>
  )
}

export function LoginForm() {
  return (
    <SearchParamsWrapper fallback={<LoginFormSkeleton />}>
      {(searchParams) => <LoginFormContent searchParams={searchParams} />}
    </SearchParamsWrapper>
  )
}
