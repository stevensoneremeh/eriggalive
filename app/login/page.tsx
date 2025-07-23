"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Music, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)

    try {
      const result = await signIn(formData)

      if (result?.error) {
        setError(result.error)
      } else {
        // Redirect to dashboard after successful login
        router.push("/dashboard")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <Music className="h-8 w-8 text-indigo-600" />
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
          </div>
          <CardDescription>Sign in to your Erigga Live account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="Enter your email" disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
