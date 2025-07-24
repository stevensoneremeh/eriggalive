import { Home, Archive } from "lucide-react"
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

      <div className="flex items-center gap-3 mb-6">
        <Archive className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-semibold">Media Vault</h1>
      </div>

      <p className="text-muted-foreground">
        Welcome to your media vault. This is where you can store and manage your files.
      </p>
    </div>
  )
}
