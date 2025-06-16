import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-background">
      <div className="max-w-md mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-orange-500">404</h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>If you believe this is an error, please contact support.</p>
        </div>
      </div>
    </div>
  )
}
