"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export function DevLoginHelper() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  const handleDevLogin = async () => {
    setIsLoading(true)

    // Simulate login
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Store a fake token in localStorage
    localStorage.setItem("dev-auth-token", "fake-token-for-development")

    // Redirect to dashboard
    router.push("/dashboard")

    setIsLoading(false)
  }

  return (
    <Card className="mt-4 border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-300">
          Development Mode Helper
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-orange-700 dark:text-orange-400 mb-2">
          This button bypasses authentication for local development only.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="w-full bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-300"
          onClick={handleDevLogin}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Access Dashboard (Dev Only)"}
        </Button>
      </CardContent>
    </Card>
  )
}
