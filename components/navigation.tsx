"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { DynamicLogo } from "@/components/dynamic-logo"
import { CoinBalance } from "@/components/coin-balance"
import { UserTierBadge } from "@/components/user-tier-badge"
import { clientAuth } from "@/lib/auth-utils"

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, profile, signOut, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Check authentication status on mount and route changes
  useEffect(() => {
    // This will refresh the session if the user is authenticated
    if (isAuthenticated) {
      clientAuth.refreshSession()
    }
  }, [pathname, isAuthenticated])

  const navItems = [
    { name: "Home", href: "/", icon: <Home className="h-5 w-5" /> },
    { name: "Community", href: "/community", icon: <Users className="h-5 w-5" /> },
    { name: "Chronicles", href: "/chronicles", icon: <BookOpen className="h-5 w-5" /> },
    { name: "Media Vault", href: "/vault", icon: <Music className="h-5 w-5" /> },
    { name: "Tickets", href: "/tickets", icon: <Ticket className="h-5 w-5" /> },
    { name: "Premium", href: "/premium", icon: <Crown className="h-5 w-5" /> },
    { name: "Merch", href: "/merch", icon: <ShoppingBag className="h-5 w-5" /> },
  ]

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/"
    }
    return pathname?.startsWith(path)
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/95 backdrop-blur shadow-md" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <DynamicLogo width={120} height={32} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.href)
                    ? "text-lime-500 bg-lime-500/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-2">
            {isAuthenticated && profile ? (
              <>
                <CoinBalance coins={profile.coins} />
                <UserTierBadge tier={profile.tier} />
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="hidden md:flex">
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
                  <Button variant="outline" size="sm" className="hidden md:flex">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="hidden md:flex bg-lime-500 hover:bg-lime-600 text-teal-900">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80%] sm:w-[350px]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between py-4">
                    <DynamicLogo width={100} height={28} />
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                      <X className="h-6 w-6" />
                      <span className="sr-only">Close menu</span>
                    </Button>
                  </div>

                  {/* User Info (if logged in) */}
                  {isAuthenticated && profile && (
                    <div className="border-b border-border py-4 mb-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-lime-500/20 flex items-center justify-center">
                          <User className="h-6 w-6 text-lime-500" />
                        </div>
                        <div>
                          <p className="font-medium">{profile.username || "User"}</p>
                          <p className="text-xs text-muted-foreground">{profile.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <CoinBalance coins={profile.coins} />
                        <UserTierBadge tier={profile.tier} />
                      </div>
                    </div>
                  )}

                  {/* Mobile Navigation */}
                  <nav className="flex-1">
                    <ul className="space-y-1">
                      {navItems.map((item) => (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={`flex items-center px-3 py-3 rounded-md ${
                              isActive(item.href)
                                ? "bg-lime-500/10 text-lime-500"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <span className="mr-3">{item.icon}</span>
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>

                  {/* Mobile Auth Actions */}
                  <div className="border-t border-border pt-4 mt-auto">
                    {isAuthenticated ? (
                      <div className="space-y-2">
                        <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full justify-start">
                            <User className="h-4 w-4 mr-2" />
                            Dashboard
                          </Button>
                        </Link>
                        <Link href="/premium" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full justify-start">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Buy Coins
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
                          <Button variant="outline" className="w-full justify-start">
                            <LogIn className="h-4 w-4 mr-2" />
                            Login
                          </Button>
                        </Link>
                        <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button className="w-full justify-start bg-lime-500 hover:bg-lime-600 text-teal-900">
                            Sign Up
                          </Button>
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
