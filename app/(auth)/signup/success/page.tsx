<<<<<<< HEAD
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail, ArrowRight } from "lucide-react"

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
=======
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
>>>>>>> new
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
<<<<<<< HEAD
          <CardTitle className="text-2xl font-bold">Account Created!</CardTitle>
          <CardDescription>
            Welcome to the Erigga Live community. Your account has been successfully created.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Check Your Email</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  We've sent you a verification email. Please click the link in the email to verify your account.
                </p>
              </div>
=======
          <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
            Account Created Successfully!
          </CardTitle>
          <CardDescription>Welcome to the Erigga Live community</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Check Your Email</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                We've sent you a verification email. Please click the link in the email to verify your account before
                logging in.
              </p>
            </div>

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>After verifying your email, you'll be able to:</p>
              <ul className="list-disc list-inside space-y-1 text-left">
                <li>Access your personalized dashboard</li>
                <li>Join community discussions</li>
                <li>Earn and manage Erigga coins</li>
                <li>Participate in exclusive events</li>
                <li>Connect with other fans</li>
              </ul>
>>>>>>> new
            </div>
          </div>

          <div className="space-y-3">
<<<<<<< HEAD
            <h4 className="font-medium">What's Next?</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                <span>Verify your email address</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                <span>Complete your profile setup</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                <span>Join the community discussions</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                <span>Explore exclusive content</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col space-y-3">
            <Button asChild className="w-full">
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/community">Explore Community</Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Didn't receive the email?{" "}
              <Link href="/auth/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                Resend verification
              </Link>
=======
            <Button asChild className="w-full">
              <Link href="/login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Link>
            </Button>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Didn't receive the email? Check your spam folder or contact support.
>>>>>>> new
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
