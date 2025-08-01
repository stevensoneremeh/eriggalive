"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail, ArrowRight } from "lucide-react"
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
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
            Account Created Successfully!
          </CardTitle>
          <CardDescription className="text-center">
            Welcome to the Erigga Live community! We're excited to have you join us.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Check Your Email</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  We've sent you a verification email. Please click the link in the email to verify your account before
                  logging in.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold mb-2">What's Next?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ Verify your email address</li>
                <li>🎵 Explore exclusive Erigga content</li>
                <li>💬 Join the community discussions</li>
                <li>🪙 Earn Erigga Coins for activities</li>
              </ul>
            </div>

            <Button asChild className="w-full">
              <Link href="/login" className="flex items-center justify-center">
                Continue to Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Didn't receive the email?{" "}
                <button className="text-primary hover:underline">Resend verification email</button>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
