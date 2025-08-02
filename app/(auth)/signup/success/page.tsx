"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DynamicLogo } from "@/components/dynamic-logo"

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <DynamicLogo className="h-12 w-auto" />
          </div>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">Account Created Successfully!</CardTitle>
          <CardDescription className="text-lg">
            Welcome to the Erigga Live community! Please verify your email to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Check Your Email</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  We've sent you a verification email. Please click the link in the email to verify your account before
                  logging in.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              After verifying your email, you can sign in to access your dashboard and join the Erigga Live community.
            </p>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Login
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
