"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useTheme } from "@/contexts/theme-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, X, Sun, Moon, Home, Music, Users, Radio, ShoppingBag, Ticket, Coins } from "lucide-react"
import { cn } from "@/lib/utils"
import { CoinBalance } from "@/components/coin-balance"

export function Navigation() {
  const { theme, setTheme } = useTheme()
  const { user, isAuthenticated, signOut } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Handle scroll effect for navigation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Navigation links
  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Vault", href: "/vault", icon: Music },
    { name: "Community", href: "/community", icon: Users },
    { name: "Radio", href: "/radio", icon: Radio },
    { name: "Merch", href: "/merch", icon: ShoppingBag },
    { name: "Tickets", href: "/tickets", icon: Ticket },
  ]

  // Check if a link is active
  const isActive = (path: string) => {
    if (path === "/" && pathname !== "/") return false
    return pathname.startsWith(path)
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-background/80 backdrop-blur-md shadow-md" : "bg-transparent",
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="relative h-8 w-32 md:h-10 md:w-40">
              <Image
                src={theme === "dark" ? "/images/loggotrans-light.png" : "/images/loggotrans-dark.png"}
                alt="Erigga Live"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive(link.href) ? "bg-primary/10 text-primary" : "hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Coin Balance - Only show when authenticated */}
            {isAuthenticated && <CoinBalance />}

            {/* User Menu or Auth Buttons */}
            {isAuthenticated ? (
              <Link href="/profile">
                <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                  <AvatarImage src={user?.avatar_url || ""} alt={user?.username || "User"} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
                  <Menu size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80%] sm:w-[350px] pt-12">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X size={24} />
                </Button>

                <div className="flex flex-col space-y-6 mt-4">
                  {/* Mobile User Section */}
                  {isAuthenticated ? (
                    <div className="flex items-center space-x-4 p-4 bg-accent/30 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatar_url || ""} alt={user?.username || "User"} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {user?.username?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user?.username || "User"}</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-2 p-4 bg-accent/30 rounded-lg">
                      <Button asChild>
                        <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                          Login
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                          Sign Up
                        </Link>
                      </Button>
                    </div>
                  )}

                  {/* Mobile Navigation Links */}
                  <nav className="flex flex-col space-y-1">
                    {navLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                          isActive(link.href) ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent",
                        )}
                      >
                        <link.icon size={20} />
                        <span>{link.name}</span>
                      </Link>
                    ))}

                    {/* Additional Mobile Links */}
                    <Link
                      href="/coins"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                        isActive("/coins") ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent",
                      )}
                    >
                      <Coins size={20} />
                      <span>Coins</span>
                    </Link>

                    {isAuthenticated && (
                      <Link
                        href="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                          isActive("/profile") ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent",
                        )}
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {user?.username?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span>Profile</span>
                      </Link>
                    )}

                    {/* Theme Toggle in Mobile Menu */}
                    <button
                      onClick={() => {
                        setTheme(theme === "dark" ? "light" : "dark")
                      }}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-accent text-left w-full"
                    >
                      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                      <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                    </button>

                    {/* Sign Out Button (Only when authenticated) */}
                    {isAuthenticated && (
                      <button
                        onClick={() => {
                          signOut()
                          setIsMobileMenuOpen(false)
                        }}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-accent text-left w-full text-red-500 hover:text-red-600"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
