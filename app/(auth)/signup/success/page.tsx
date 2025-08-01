"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail } from "lucide-react"
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
          <CardDescription className="text-center">Welcome to the Erigga Live community</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Check Your Email</h3>
              <p className="text-sm text-muted-foreground">
                We've sent you a verification email. Please check your inbox and click the verification link to activate
                your account.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">What's next?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Check your email inbox (and spam folder)</li>
                <li>• Click the verification link</li>
                <li>• Return here to sign in</li>
                <li>• Start exploring the community!</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/login">Continue to Sign In</Link>
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Didn't receive the email?{" "}
            <button className="text-primary hover:underline underline-offset-4">Resend verification</button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
