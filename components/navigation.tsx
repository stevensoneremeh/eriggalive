"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, User, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { DynamicLogo } from "@/components/dynamic-logo"
import { UserTierBadge } from "@/components/user-tier-badge"
import { CoinBalance } from "@/components/coin-balance"

const publicNavItems = [
  { href: "/", label: "Home" },
  { href: "/community", label: "Community" },
  { href: "/vault", label: "Vault" },
  { href: "/tickets", label: "Tickets" },
  { href: "/merch", label: "Merch" },
]

const authenticatedNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/community", label: "Community" },
  { href: "/vault", label: "Vault" },
  { href: "/tickets", label: "Tickets" },
  { href: "/premium", label: "Premium" },
  { href: "/merch", label: "Merch" },
  { href: "/coins", label: "Coins" },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, signOut, isLoading } = useAuth()

  const navItems = isAuthenticated ? authenticatedNavItems : publicNavItems

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const handleNavClick = () => {
    setIsOpen(false)
  }

  // Don't render navigation on auth pages
  if (pathname?.startsWith("/login") || pathname?.startsWith("/signup")) {
    return null
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <DynamicLogo className="h-8 w-8" />
          <span className="font-bold text-xl">Erigga</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop Auth Section */}
        <div className="hidden md:flex items-center space-x-4">
          {isLoading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          ) : isAuthenticated && user ? (
            <>
              <CoinBalance />
              <UserTierBadge tier={user.tier} />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-primary"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="sm">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="flex items-center space-x-2 pb-4 border-b">
                <DynamicLogo className="h-6 w-6" />
                <span className="font-bold">Erigga</span>
              </div>

              {/* Mobile User Info */}
              {isAuthenticated && user && (
                <div className="py-4 border-b space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <CoinBalance />
                    <UserTierBadge tier={user.tier} />
                  </div>
                </div>
              )}

              {/* Mobile Navigation Links */}
              <div className="flex-1 py-4">
                <div className="space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pathname === item.href
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-primary hover:bg-muted"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile Auth Section */}
              <div className="border-t pt-4">
                {isAuthenticated ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="w-full justify-start text-muted-foreground hover:text-primary"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button asChild variant="ghost" size="sm" className="w-full">
                      <Link href="/login" onClick={handleNavClick}>
                        Sign In
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="w-full">
                      <Link href="/signup" onClick={handleNavClick}>
                        Sign Up
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
