import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Home, ArrowLeft } from "lucide-react"

// Static 404 page - no client-side hooks
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center space-y-6">
      <div className="space-y-4">
        <h1 className="text-6xl font-bold text-orange-500">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md">The page you're looking for doesn't exist or has been moved.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild className="bg-lime-500 hover:bg-lime-600 text-teal-900">
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Return Home
          </Link>
        </Button>

        <Button asChild variant="outline" className="flex items-center gap-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Go to Dashboard
          </Link>
        </Button>
      </div>

      <div className="text-sm text-muted-foreground mt-8">
        <p>If you believe this is an error, please contact support.</p>
      </div>
    </div>
  )
}
