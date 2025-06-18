import { Home } from "lucide-react"
import Link from "next/link"

export default function VaultPage() {
  return (
    <div className="container py-10">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors flex items-center">
          <Home className="h-4 w-4 mr-1" />
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Media Vault</span>
      </nav>

      <h1 className="text-3xl font-semibold mb-4">Media Vault</h1>
      <p className="text-muted-foreground">
        Welcome to your media vault. This is where you can store and manage your files.
      </p>
    </div>
  )
}
