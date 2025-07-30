"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const { isPreviewMode } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      // In preview mode, always succeed
      if (isPreviewMode) {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setSuccess(true)
        setLoading(false)
        return
      }

      // Real password reset logic would go here
      setError("Password reset is only available in production.")
    } catch (err) {
      console.error("Error during password reset:", err)
      setError("An unexpected error occurred. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="font-street text-4xl text-gradient mb-2">RESET PASSWORD</h1>
          <p className="text-muted-foreground">Enter your email to reset your password</p>
        </div>

        <Card className="bg-card/50 border-orange-500/20">
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>We'll send you a link to reset your password</CardDescription>
          </CardHeader>
          <CardContent>
            {!success ? (
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="bg-background/50"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <div className="text-center mt-4">
                  <Link href="/login" className="text-orange-500 hover:underline text-sm">
                    Back to login
                  </Link>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">
                    Password reset link sent! Check your email for instructions.
                  </AlertDescription>
                </Alert>

                <div className="text-center mt-4">
                  <Link href="/login" className="text-orange-500 hover:underline">
                    Back to login
                  </Link>
                </div>
              </div>
            )}

            {isPreviewMode && !success && (
              <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  <strong>Preview Mode:</strong> Password reset is simulated in preview mode.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
