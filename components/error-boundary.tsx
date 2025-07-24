"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error("Error caught by error boundary:", error)
      setError(error.error)
      setHasError(true)
    }

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection caught by error boundary:", event)
      setError(new Error(event.reason || "Unknown promise rejection"))
      setHasError(true)
    }

    window.addEventListener("error", errorHandler)
    window.addEventListener("unhandledrejection", rejectionHandler)

    return () => {
      window.removeEventListener("error", errorHandler)
      window.removeEventListener("unhandledrejection", rejectionHandler)
    }
  }, [])

  if (hasError) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5 mr-2" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="font-mono text-sm">
                {error?.message || "An unknown error occurred"}
              </AlertDescription>
            </Alert>
            <p className="text-muted-foreground">
              We apologize for the inconvenience. Please try refreshing the page or contact support if the problem
              persists.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()} className="mr-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
            <Button variant="outline" asChild>
              <a href="/">Go to Homepage</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}

export default ErrorBoundary
