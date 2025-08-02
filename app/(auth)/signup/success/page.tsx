"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Mail, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function SignupSuccessPage() {
  const { user } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Account Created!</CardTitle>
          <CardDescription className="text-center">Welcome to the Erigga Live community</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              We've sent a verification email to your inbox. Please check your email and click the verification link to
              activate your account.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="font-semibold">What's next?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>1. Check your email for the verification link</li>
                <li>2. Click the link to verify your account</li>
                <li>3. Return here to sign in and explore</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go to Sign In
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Didn't receive the email? Check your spam folder or{" "}
              <Link href="/signup" className="text-primary hover:underline">
                try signing up again
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
