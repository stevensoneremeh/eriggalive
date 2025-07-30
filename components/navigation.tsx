"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { DynamicLogo } from "@/components/dynamic-logo"
import {
  Home,
  Users,
  Radio,
  Archive,
  Gamepad2,
  Coins,
  Calendar,
  ShoppingBag,
  User,
  Settings,
  LogOut,
  Menu,
  Sun,
  Moon,
  Monitor,
} from "lucide-react"

const navigationItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/community", label: "Community", icon: Users },
  { href: "/radio", label: "Radio", icon: Radio },
  { href: "/vault", label: "Vault", icon: Archive },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/coins", label: "Coins", icon: Coins },
  { href: "/meet-greet", label: "Meet & Greet", icon: Calendar },
  { href: "/merch", label: "Merch", icon: ShoppingBag },
]

export function Navigation() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsOpen(false)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const toggleTheme = () => {
    if (!mounted) return

    const themes = ["light", "dark", "system"]
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const getThemeIcon = () => {
    if (!mounted) return Monitor

    switch (theme) {
      case "light":
        return Sun
      case "dark":
        return Moon
      default:
        return Monitor
    }
  }

  const ThemeIcon = getThemeIcon()

  const NavContent = () => (
    <>
      <div className="flex flex-col space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col space-y-2">
        <Button variant="ghost" onClick={toggleTheme} className="justify-start px-3 py-2 h-auto">
          <ThemeIcon className="h-5 w-5 mr-3" />
          <span>Theme</span>
        </Button>

        {user ? (
          <>
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <User className="h-5 w-5" />
              <span>Profile</span>
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="justify-start px-3 py-2 h-auto text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span>Sign Out</span>
            </Button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <User className="h-5 w-5" />
              <span>Sign In</span>
            </Link>
            <Link
              href="/signup"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <User className="h-5 w-5" />
              <span>Sign Up</span>
            </Link>
          </>
        )}
      </div>
    </>
  )

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <DynamicLogo />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navigationItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Desktop User Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            <ThemeIcon className="h-4 w-4" />
          </Button>

          {user ? (
            <div className="flex items-center space-x-2">
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  Profile
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
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

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <div className="flex flex-col h-full">
              <div className="flex items-center space-x-2 mb-6">
                <DynamicLogo />
              </div>
              <div className="flex-1">
                <NavContent />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
