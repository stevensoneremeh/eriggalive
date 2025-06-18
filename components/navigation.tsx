"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Home, Users, Vault, Ticket, Crown, ShoppingBag, LayoutDashboard, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { DynamicLogo } from "./dynamic-logo"

// Navigation items configuration
const navigationItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Community", href: "/community", icon: Users },
  { name: "Vault", href: "/vault", icon: Vault },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Premium", href: "/premium", icon: Crown },
  { name: "Merch", href: "/merch", icon: ShoppingBag },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
]

// Navigation skeleton for loading state
function NavigationSkeleton() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-32 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-4 w-16 bg-muted animate-pulse rounded"></div>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-9 w-20 bg-muted animate-pulse rounded"></div>
            <div className="md:hidden h-9 w-9 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    </nav>
  )
}

// Main navigation content component
function NavigationContent() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, signOut, isAuthenticated } = useAuth()

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname, searchParams])

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <DynamicLogo className="h-8 w-auto" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-lime-500 ${
                    isActive(item.href) ? "text-lime-500" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <span className="hidden sm:inline text-sm text-muted-foreground">
                  Welcome, {user?.email?.split("@")[0] || "User"}
                </span>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="flex items-center space-x-1">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="bg-lime-500 hover:bg-lime-600 text-teal-900">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center space-x-3 text-lg font-medium transition-colors hover:text-lime-500 p-2 rounded-md ${
                          isActive(item.href) ? "text-lime-500 bg-lime-500/10" : "text-foreground"
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}

                  {isAuthenticated && (
                    <div className="pt-4 border-t">
                      <Button variant="outline" onClick={handleSignOut} className="w-full flex items-center space-x-2">
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}

// Main navigation component with Suspense boundary
export function Navigation() {
  return (
    <Suspense fallback={<NavigationSkeleton />}>
      <NavigationContent />
    </Suspense>
  )
}
