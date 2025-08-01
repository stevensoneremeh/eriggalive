"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail } from "lucide-react"

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Welcome to Erigga Live!</CardTitle>
          <CardDescription className="text-gray-300">Your account has been created successfully</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h3 className="text-white font-medium">Check Your Email</h3>
                <p className="text-gray-300 text-sm mt-1">
                  We've sent you a verification email. Please click the link in the email to verify your account before
                  logging in.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-medium">What's Next?</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                <span>Verify your email address</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                <span>Complete your profile setup</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                <span>Explore exclusive content and community</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                <span>Start earning Erigga Coins</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link href="/login">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                Go to Login
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent">
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-xs">
              Didn't receive the email? Check your spam folder or{" "}
              <Link href="/signup" className="text-blue-400 hover:text-blue-300">
                try again
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
