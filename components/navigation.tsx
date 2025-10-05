"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Menu,
  X,
  User,
  LogOut,
  LogIn,
  CreditCard,
  Music,
  Ticket,
  ShoppingBag,
  Home,
  BookOpen,
  Users,
  Crown,
  LayoutDashboard,
  Sun,
  Moon,
  Monitor,
  Target,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { DynamicLogo } from "@/components/dynamic-logo"
import { CoinBalance } from "@/components/coin-balance"
import { UserTierBadge } from "@/components/user-tier-badge"
import { cn } from "@/lib/utils"

// Navigation skeleton component
function NavigationSkeleton() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="hidden lg:flex items-center space-x-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-4 w-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </header>
  )
}

// Main navigation content
function NavigationContent() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { user, profile, signOut, isAuthenticated, isLoading } = useAuth()
  const { theme, setTheme, resolvedTheme, isLoading: themeLoading } = useTheme()

  // Handle mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const navItems = [
    { name: "Home", href: "/", icon: <Home className="h-5 w-5" /> },
    { name: "Mission", href: "/mission", icon: <Target className="h-5 w-5" /> },
    { name: "Community", href: "/community", icon: <Users className="h-5 w-5" /> },
    { name: "Chronicles", href: "/chronicles", icon: <BookOpen className="h-5 w-5" /> },
    { name: "Media Vault", href: "/vault", icon: <Music className="h-5 w-5" /> },
<<<<<<< HEAD
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: "Tickets", href: "/tickets", icon: <Ticket className="h-5 w-5" /> },
    { name: "Premium", href: "/premium", icon: <Crown className="h-5 w-5" /> },
    { name: "Merch", href: "/merch", icon: <ShoppingBag className="h-5 w-5" /> },
=======
    { name: "Merch", href: "/merch", icon: <ShoppingBag className="h-5 w-5" /> },
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: "Tickets", href: "/tickets", icon: <Ticket className="h-5 w-5" /> },
    { name: "Premium", href: "/premium", icon: <Crown className="h-5 w-5" /> },
>>>>>>> new
  ]

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/"
    }
    if (path === "/dashboard") {
      return pathname === "/dashboard" || pathname?.startsWith("/dashboard/")
    }
    return pathname?.startsWith(path)
  }

  // Don't render until mounted to prevent hydration issues
  if (!mounted || themeLoading) {
    return <NavigationSkeleton />
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
        isScrolled ? "bg-background/95 backdrop-blur shadow-md" : "bg-background/80 backdrop-blur",
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 z-10">
<<<<<<< HEAD
            <DynamicLogo width={120} height={32} />
=======
            <DynamicLogo responsive={true} width={120} height={32} />
>>>>>>> new
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                  isActive(item.href)
                    ? "text-primary bg-primary/10 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle - Desktop */}
            <div className="hidden md:flex items-center space-x-1 mr-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme("light")}
                className={cn(
                  "p-2 transition-all duration-200",
                  theme === "light" && "bg-accent text-accent-foreground",
                )}
                title="Light mode"
              >
                <Sun className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme("dark")}
                className={cn(
                  "p-2 transition-all duration-200",
                  theme === "dark" && "bg-accent text-accent-foreground",
                )}
                title="Dark mode"
              >
                <Moon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme("system")}
                className={cn(
                  "p-2 transition-all duration-200",
                  theme === "system" && "bg-accent text-accent-foreground",
                )}
                title="System mode"
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </div>

            {/* User Authentication */}
            {!isLoading && (
              <>
                {isAuthenticated && profile ? (
                  <>
                    <div className="hidden md:flex items-center space-x-2">
<<<<<<< HEAD
                      <CoinBalance coins={profile.coins} size="sm" />
=======
                      <CoinBalance size="sm" />
>>>>>>> new
                      <UserTierBadge tier={profile.tier} />
                    </div>
                    <Link href="/dashboard">
                      <Button variant="outline" size="sm" className="hidden md:flex bg-transparent">
                        <User className="h-4 w-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={signOut}
                      className="text-red-500 hover:text-red-600 hover:bg-red-100/10 hidden md:flex"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="outline" size="sm" className="hidden md:flex bg-transparent">
                        <LogIn className="h-4 w-4 mr-2" />
                        Login
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button size="sm" className="hidden md:flex bg-primary hover:bg-primary/90">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
<<<<<<< HEAD
              <SheetContent side="right" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <DynamicLogo width={100} height={28} />
=======
              <SheetContent side="right" className="w-80 p-0 bg-background border-border">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <DynamicLogo responsive={true} width={100} height={28} />
>>>>>>> new
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                      <X className="h-6 w-6" />
                    </Button>
                  </div>

                  {/* User Info (Mobile) */}
                  {isAuthenticated && profile && (
<<<<<<< HEAD
                    <div className="p-4 border-b">
=======
                    <div className="p-4 border-b border-border">
>>>>>>> new
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{profile.username || "User"}</p>
                          <p className="text-xs text-muted-foreground">{profile.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
<<<<<<< HEAD
                        <CoinBalance coins={profile.coins} size="sm" />
=======
                        <CoinBalance size="sm" />
>>>>>>> new
                        <UserTierBadge tier={profile.tier} />
                      </div>
                    </div>
                  )}

                  {/* Mobile Navigation */}
                  <nav className="flex-1 p-4">
                    <ul className="space-y-2">
                      {navItems.map((item) => (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center px-3 py-3 rounded-md transition-all duration-200",
                              isActive(item.href)
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground",
                            )}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <span className="mr-3">{item.icon}</span>
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>

                  {/* Mobile Theme Toggle */}
<<<<<<< HEAD
                  <div className="p-4 border-t">
=======
                  <div className="p-4 border-t border-border">
>>>>>>> new
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Theme</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={theme === "light" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTheme("light")}
                          className="flex flex-col items-center py-3 h-auto"
                        >
                          <Sun className="h-4 w-4 mb-1" />
                          <span className="text-xs">Light</span>
                        </Button>
                        <Button
                          variant={theme === "dark" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTheme("dark")}
                          className="flex flex-col items-center py-3 h-auto"
                        >
                          <Moon className="h-4 w-4 mb-1" />
                          <span className="text-xs">Dark</span>
                        </Button>
                        <Button
                          variant={theme === "system" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTheme("system")}
                          className="flex flex-col items-center py-3 h-auto"
                        >
                          <Monitor className="h-4 w-4 mb-1" />
                          <span className="text-xs">Auto</span>
                        </Button>
                      </div>
                    </div>

                    {/* Mobile Auth Actions */}
                    {isAuthenticated ? (
                      <div className="space-y-2">
                        <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full justify-start bg-transparent">
                            <User className="h-4 w-4 mr-2" />
                            Dashboard
                          </Button>
                        </Link>
                        <Link href="/coins" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full justify-start bg-transparent">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Manage Coins
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100/10"
                          onClick={() => {
                            signOut()
                            setIsMobileMenuOpen(false)
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full justify-start bg-transparent">
                            <LogIn className="h-4 w-4 mr-2" />
                            Login
                          </Button>
                        </Link>
                        <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button className="w-full justify-start bg-primary hover:bg-primary/90">Sign Up</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

// Main Navigation component with Suspense boundary
export function Navigation() {
  return (
    <Suspense fallback={<NavigationSkeleton />}>
      <NavigationContent />
    </Suspense>
  )
}
