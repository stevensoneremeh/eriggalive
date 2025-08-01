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
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">Account Created Successfully!</CardTitle>
          <CardDescription>Welcome to the Erigga Live community</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Mail className="h-5 w-5" />
              <span>Check your email to verify your account</span>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Next Steps:</h3>
              <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 text-left">
                <li>1. Check your email inbox</li>
                <li>2. Click the verification link</li>
                <li>3. Return here to sign in</li>
                <li>4. Start exploring exclusive content!</li>
              </ol>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Didn't receive an email? Check your spam folder or contact support.</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/login">
                Continue to Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Need help?{" "}
              <Link href="/contact" className="text-primary hover:underline underline-offset-4">
                Contact Support
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
