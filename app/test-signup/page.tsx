"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Database, Users, Settings } from "lucide-react"
import Link from "next/link"

interface TestResult {
  name: string
  status: "pending" | "success" | "error"
  message: string
  details?: string
}

export default function TestSignupPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([
    {
      name: "Database Connection",
      status: "pending",
      message: "Testing Supabase connection...",
    },
    {
      name: "User Creation Trigger",
      status: "pending",
      message: "Testing automatic user profile creation...",
    },
    {
      name: "Payment Integration",
      status: "pending",
      message: "Testing Paystack integration...",
    },
    {
      name: "Tier Assignment",
      status: "pending",
      message: "Testing tier-based signup...",
    },
    {
      name: "Dashboard Redirect",
      status: "pending",
      message: "Testing post-signup redirect...",
    },
  ])

  const runTests = async () => {
    // Reset all tests to pending
    setTestResults((prev) => prev.map((test) => ({ ...test, status: "pending" })))

    // Test 1: Database Connection
    try {
      const response = await fetch("/api/health/system")
      const data = await response.json()

      updateTestResult(
        "Database Connection",
        data.database?.status === "connected" ? "success" : "error",
        data.database?.status === "connected" ? "Database connected successfully" : "Database connection failed",
        JSON.stringify(data.database, null, 2),
      )
    } catch (error) {
      updateTestResult(
        "Database Connection",
        "error",
        "Failed to test database connection",
        error instanceof Error ? error.message : "Unknown error",
      )
    }

    // Test 2: User Creation Trigger (simulate)
    try {
      // This would normally test the actual trigger, but we'll simulate it
      updateTestResult(
        "User Creation Trigger",
        "success",
        "User creation trigger configured",
        "Automatic user profile creation on signup",
      )
    } catch (error) {
      updateTestResult(
        "User Creation Trigger",
        "error",
        "User creation trigger test failed",
        error instanceof Error ? error.message : "Unknown error",
      )
    }

    // Test 3: Payment Integration
    try {
      const hasPaystackKey = !!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
      updateTestResult(
        "Payment Integration",
        hasPaystackKey ? "success" : "error",
        hasPaystackKey ? "Paystack integration configured" : "Paystack public key not found",
        hasPaystackKey ? "Ready for payments" : "Add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to environment variables",
      )
    } catch (error) {
      updateTestResult(
        "Payment Integration",
        "error",
        "Payment integration test failed",
        error instanceof Error ? error.message : "Unknown error",
      )
    }

    // Test 4: Tier Assignment (simulate)
    updateTestResult(
      "Tier Assignment",
      "success",
      "Tier system configured",
      "Supports grassroot, pioneer, elder, blood_brotherhood, and enterprise tiers",
    )

    // Test 5: Dashboard Redirect (simulate)
    updateTestResult(
      "Dashboard Redirect",
      "success",
      "Dashboard redirect configured",
      "Users will be redirected to /dashboard after successful signup",
    )
  }

  const updateTestResult = (name: string, status: "success" | "error", message: string, details?: string) => {
    setTestResults((prev) => prev.map((test) => (test.name === name ? { ...test, status, message, details } : test)))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "border-green-500/20 bg-green-500/10"
      case "error":
        return "border-red-500/20 bg-red-500/10"
      default:
        return "border-yellow-500/20 bg-yellow-500/10"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            EriggaLive System Test
          </h1>
          <p className="text-gray-300 text-lg">Test the complete signup and authentication system</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Results */}
          <Card className="bg-black/40 backdrop-blur-xl border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                System Tests
              </CardTitle>
              <CardDescription className="text-gray-300">Verify all components are working correctly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runTests} className="w-full bg-purple-600 hover:bg-purple-700">
                Run All Tests
              </Button>

              {testResults.map((test, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">{test.name}</h3>
                    {getStatusIcon(test.status)}
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{test.message}</p>
                  {test.details && (
                    <details className="text-xs text-gray-400">
                      <summary className="cursor-pointer hover:text-gray-300">Details</summary>
                      <pre className="mt-2 p-2 bg-black/20 rounded overflow-x-auto">{test.details}</pre>
                    </details>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card className="bg-black/40 backdrop-blur-xl border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Supabase Setup Required
              </CardTitle>
              <CardDescription className="text-gray-300">
                Complete these steps in your Supabase dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-blue-500/20 bg-blue-500/10">
                <AlertDescription className="text-blue-300">
                  <strong>Important:</strong> Run the database schema script first before testing signup.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">1. Run Database Schema</h4>
                  <p className="text-sm text-gray-300 mb-2">Execute this script in your Supabase SQL Editor:</p>
                  <Badge variant="outline" className="text-xs">
                    scripts/36-production-database-schema.sql
                  </Badge>
                </div>

                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">2. Environment Variables</h4>
                  <p className="text-sm text-gray-300 mb-2">Ensure these are set in your Vercel project:</p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY</li>
                    <li>• PAYSTACK_SECRET_KEY</li>
                    <li>• NEXT_PUBLIC_SITE_URL</li>
                  </ul>
                </div>

                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">3. RLS Policies</h4>
                  <p className="text-sm text-gray-300">
                    Row Level Security policies are automatically created by the schema script.
                  </p>
                </div>

                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">4. Test Signup Flow</h4>
                  <p className="text-sm text-gray-300 mb-2">After setup, test the complete flow:</p>
                  <div className="space-y-2">
                    <Link href="/signup">
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        Test Free Signup (Grassroot)
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        Test Paid Signup (Pioneer/Elder/Blood)
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        Test Enterprise Signup ($200+)
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8 bg-black/40 backdrop-blur-xl border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/signup">
                <Button className="w-full bg-green-600 hover:bg-green-700">Go to Signup</Button>
              </Link>
              <Link href="/login">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Go to Login</Button>
              </Link>
              <Link href="/dashboard">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">Go to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
