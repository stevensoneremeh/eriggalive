"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { RefreshCw, Home } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-red-500">Error</h1>
            <h2 className="text-2xl font-semibold">Something went wrong!</h2>
            <p className="text-muted-foreground max-w-md">
              An unexpected error occurred. Please try again or return to the home page.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={reset} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>

            <Button asChild variant="outline" className="flex items-center gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
