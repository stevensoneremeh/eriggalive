"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DynamicLogo } from "@/components/dynamic-logo"
import { useAuth } from "@/contexts/auth-context"
import { useThemeContext } from "@/contexts/theme-context"
import {
  Menu,
  Home,
  Users,
  Radio,
  Shield,
  Coins,
  Crown,
  MessageCircle,
  Target,
  Ticket,
  ShoppingBag,
  Video,
  User,
  LogOut,
  Sun,
  Moon,
  Gamepad2,
} from "lucide-react"

const navigationItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Community", href: "/community", icon: Users },
  { name: "Radio", href: "/radio", icon: Radio },
  { name: "Vault", href: "/vault", icon: Shield },
  { name: "Games", href: "/games", icon: Gamepad2 },
]

const authenticatedItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Coins", href: "/coins", icon: Coins },
  { name: "Premium", href: "/premium", icon: Crown },
  { name: "Chat", href: "/chat", icon: MessageCircle },
  { name: "Mission", href: "/mission", icon: Target },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Merch", href: "/merch", icon: ShoppingBag },
  { name: "Meet & Greet", href: "/meet-greet", icon: Video },
]

export function Navigation() {
  const pathname = usePathname()
  const { user, profile, signOut, isLoading } = useAuth()
  const { theme, setTheme, mounted } = useThemeContext()
  const [isOpen, setIsOpen] = useState(false)

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 hidden md:flex">
            <div className="mr-6 flex items-center space-x-2">
              <div className="h-8 w-8 bg-muted rounded animate-pulse" />
              <div className="h-6 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </nav>
    )
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  const closeSheet = () => setIsOpen(false)

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Desktop Navigation */}
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <DynamicLogo className="h-8 w-8" />
            <span className="hidden font-bold sm:inline-block">Erigga Live</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 transition-colors hover:text-foreground/80 ${
                    pathname === item.href ? "text-foreground" : "text-foreground/60"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <Link href="/" className="flex items-center space-x-2" onClick={closeSheet}>
              <DynamicLogo className="h-6 w-6" />
              <span className="font-bold">Erigga Live</span>
            </Link>
            <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
              <div className="flex flex-col space-y-3">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={closeSheet}
                      className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-foreground/80 ${
                        pathname === item.href ? "text-foreground" : "text-foreground/60"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}

                {user && (
                  <>
                    <Separator className="my-4" />
                    {authenticatedItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={closeSheet}
                          className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-foreground/80 ${
                            pathname === item.href ? "text-foreground" : "text-foreground/60"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      )
                    })}
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Right side items */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link href="/" className="flex items-center space-x-2 md:hidden">
              <DynamicLogo className="h-6 w-6" />
              <span className="font-bold">Erigga Live</span>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* User Menu */}
            {isLoading ? (
              <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
            ) : user ? (
              <div className="flex items-center space-x-2">
                {profile && (
                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    <Coins className="mr-1 h-3 w-3" />
                    {profile.coins_balance?.toLocaleString() || 0}
                  </Badge>
                )}
                <Link href="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4" />
                    <span className="sr-only">Profile</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Sign out</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
