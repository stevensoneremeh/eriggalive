"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Home, Users, Coins, Trophy, Music, Crown, LogOut, User, Bell, Settings } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "next-themes"
import { DynamicLogo } from "@/components/dynamic-logo"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function NavigationContent() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const { theme } = useTheme()

  const navigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/community", label: "Community", icon: Users, badge: "New" },
    { href: "/coins", label: "Coins", icon: Coins },
    { href: "/vault", label: "Vault", icon: Trophy },
    { href: "/chronicles", label: "Chronicles", icon: Music },
    { href: "/premium", label: "Premium", icon: Crown, highlight: true },
  ]

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <>
      {/* Logo Section - Enhanced */}
      <Link href="/" className="flex items-center space-x-3 group">
        <div className="relative">
          <DynamicLogo className="h-10 w-10 transition-transform group-hover:scale-105" />
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-red-600 rounded-full opacity-0 group-hover:opacity-20 transition-opacity blur-sm" />
        </div>
        <div className="hidden sm:block">
          <span className="font-bold text-xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Erigga Live
          </span>
          <div className="text-xs text-muted-foreground font-medium">Official Fan Platform</div>
        </div>
      </Link>

      {/* Desktop Navigation - Enhanced */}
      <nav className="hidden lg:flex items-center space-x-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25"
                  : item.highlight
                    ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <item.icon
                className={`h-4 w-4 transition-transform group-hover:scale-110 ${isActive ? "text-white" : ""}`}
              />
              <span className="font-medium">{item.label}</span>
              {item.badge && !isActive && (
                <Badge
                  variant="secondary"
                  className="ml-1 text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                >
                  {item.badge}
                </Badge>
              )}
              {item.highlight && !isActive && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Menu - Enhanced */}
      <div className="flex items-center space-x-3">
        {user ? (
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative hover:bg-accent/50 rounded-xl">
              <Bell className="h-4 w-4" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-xl hover:bg-accent/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} alt={user.email} />
                    <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.user_metadata?.display_name || user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="rounded-xl hover:bg-accent/50">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                size="sm"
                className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/25"
              >
                Sign Up
              </Button>
            </Link>
          </div>
        )}

        {/* Mobile Menu Trigger */}
        <Sheet>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="sm" className="rounded-xl hover:bg-accent/50">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[350px]">
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="flex items-center space-x-3 pb-6 border-b">
                <DynamicLogo className="h-8 w-8" />
                <div>
                  <div className="font-bold text-lg bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Erigga Live
                  </div>
                  <div className="text-xs text-muted-foreground">Official Fan Platform</div>
                </div>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex flex-col space-y-2 py-6 flex-1">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                          : item.highlight
                            ? "text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && !isActive && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* Mobile User Section */}
              {user ? (
                <div className="border-t pt-6 space-y-2">
                  <div className="flex items-center space-x-3 px-4 py-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} alt={user.email} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm">
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {user.user_metadata?.display_name || user.email}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    href="/settings"
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </Link>

                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-3 rounded-xl text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Log out
                  </Button>
                </div>
              ) : (
                <div className="border-t pt-6 space-y-2">
                  <Link href="/login" className="block">
                    <Button variant="ghost" className="w-full justify-start rounded-xl hover:bg-accent/50">
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup" className="block">
                    <Button className="w-full justify-start rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}

export default function UnifiedNavigation() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-muted rounded-xl animate-pulse" />
            <div className="hidden sm:block space-y-1">
              <div className="h-5 w-24 bg-muted rounded animate-pulse" />
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="h-8 w-20 bg-muted rounded-xl animate-pulse" />
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <NavigationContent />
      </div>
    </header>
  )
}

// Named export for compatibility
export { UnifiedNavigation }
