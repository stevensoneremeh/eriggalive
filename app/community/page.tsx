import { Home } from "lucide-react"
import Link from "next/link"

export default function CommunityPage() {
  return (
    <main className="container relative">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors flex items-center">
          <Home className="h-4 w-4 mr-1" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Community</span>
      </nav>
      <div>
        <h1>Community Page</h1>
        <p>Welcome to the community page!</p>
      </div>
    </main>
  )
}
