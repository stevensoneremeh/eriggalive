"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Menu,
  Home,
  Users,
  BookOpen,
  Music,
  Ticket,
  Crown,
  ShoppingBag,
  Settings,
  Sun,
  Moon,
  Monitor,
  X,
  LogOut,
  User,
  Search,
  Bell,
  MoreHorizontal,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { DynamicLogo } from "@/components/dynamic-logo"
import { CoinBalance } from "@/components/coin-balance"
import { UserTierBadge } from "@/components/user-tier-badge"
import { cn } from "@/lib/utils"

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  description?: string
  category: "main" | "secondary" | "settings"
  showOnMobile?: boolean
}

const navigationItems: NavigationItem[] = [
  {
    name: "Home",
    href: "/",
    icon: Home,
    description: "Back to homepage",
    category: "main",
    showOnMobile: true,
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Your dashboard",
    category: "main",
    showOnMobile: true,
  },
  {
    name: "Community",
    href: "/community",
    icon: Users,
    badge: "New",
    description: "Connect with fans",
    category: "main",
    showOnMobile: true,
  },
  {
    name: "Chronicles",
    href: "/chronicles",
    icon: BookOpen,
    description: "Latest stories and news",
    category: "main",
  },
  {
    name: "Media Vault",
    href: "/vault",
    icon: Music,
    description: "Exclusive content",
    category: "main",
    showOnMobile: true,
  },
  {
    name: "Tickets",
    href: "/tickets",
    icon: Ticket,
    description: "Events and shows",
    category: "secondary",
  },
  {
    name: "Premium",
    href: "/premium",
    icon: Crown,
    description: "Upgrade your tier",
    category: "secondary",
  },
  {
    name: "Merch",
    href: "/merch",
    icon: ShoppingBag,
    description: "Official merchandise",
    category: "secondary",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Account preferences",
    category: "settings",
  },
]

export function UnifiedNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">("desktop")
  const pathname = usePathname()
  const { user, profile, signOut, isAuthenticated } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()

  // Screen size detection
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setScreenSize("mobile")
      } else if (width < 1024) {
        setScreenSize("tablet")
      } else {
        setScreenSize("desktop")
      }
    }

    updateScreenSize()
    window.addEventListener("resize", updateScreenSize)
    return () => window.removeEventListener("resize", updateScreenSize)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname?.startsWith("/dashboard/")
    }
    return pathname?.startsWith(href)
  }

  const NavigationLink = ({ item, isMobile = false }: { item: NavigationItem; isMobile?: boolean }) => {
    const Icon = item.icon
    const active = isActive(item.href)

    return (
      <Link href={item.href} className="w-full">
        <Button
          variant={active ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start transition-all duration-200",
            active && "bg-primary/10 text-primary hover:bg-primary/20",
            isMobile ? "h-12 text-base" : "h-10",
          )}
        >
          <Icon className={cn("h-5 w-5", !isMobile && "mr-3")} />
          {!isMobile && (
            <>
              <span className="truncate font-medium">{item.name}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0.5 bg-primary/20 text-primary">
                  {item.badge}
                </Badge>
              )}
            </>
          )}
        </Button>
      </Link>
    )
  }

  const ThemeToggle = ({ isMobile = false }: { isMobile?: boolean }) => {
    if (isMobile) {
      return (
        <div className="p-4 border-t">
          <p className="text-sm font-medium text-muted-foreground mb-3">Appearance</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "light", icon: Sun, label: "Light" },
              { value: "dark", icon: Moon, label: "Dark" },
              { value: "system", icon: Monitor, label: "Auto" },
            ].map(({ value, icon: Icon, label }) => (
              <Button
                key={value}
                variant={theme === value ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme(value as any)}
                className="flex flex-col items-center py-3 h-auto text-xs"
              >
                <Icon className="h-4 w-4 mb-1" />
                {label}
              </Button>
            ))}
          </div>
        </div>
      )
    }

    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="transition-all duration-200"
      >
        {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
    )
  }

  const UserSection = ({ isMobile = false }: { isMobile?: boolean }) => {
    if (!isAuthenticated || !user || !profile) return null

    if (isMobile) {
      return (
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} alt={profile?.username} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {profile?.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{profile?.username || "User"}</p>
              <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
              <UserTierBadge tier={profile?.tier || "grassroot"} size="sm" />
            </div>
          </div>
          <div className="p-3 bg-accent/30 rounded-lg">
            <CoinBalance coins={profile?.coins || 0} size="sm" />
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center space-x-4">
        <CoinBalance coins={profile?.coins || 0} size="sm" />
        <UserTierBadge tier={profile?.tier || "grassroot"} size="sm" />
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} alt={profile?.username} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
            {profile?.username?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    )
  }

  // Mobile Navigation (< 768px)
  if (screenSize === "mobile") {
    return (
      <>
        {/* Top Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-4 h-16">
            <div className="flex items-center space-x-3">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                      <DynamicLogo width={120} height={32} />
                      <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* User Section */}
                    <UserSection isMobile />

                    {/* Navigation */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Main
                        </p>
                        {navigationItems
                          .filter((item) => item.category === "main")
                          .map((item) => (
                            <NavigationLink key={item.name} item={item} isMobile />
                          ))}
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Services
                        </p>
                        {navigationItems
                          .filter((item) => item.category === "secondary")
                          .map((item) => (
                            <NavigationLink key={item.name} item={item} isMobile />
                          ))}
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Account
                        </p>
                        {navigationItems
                          .filter((item) => item.category === "settings")
                          .map((item) => (
                            <NavigationLink key={item.name} item={item} isMobile />
                          ))}
                      </div>
                    </div>

                    {/* Theme Toggle */}
                    <ThemeToggle isMobile />

                    {/* Footer Actions */}
                    {isAuthenticated && (
                      <div className="p-4 border-t space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                          <Link href="/profile">
                            <User className="h-4 w-4 mr-2" />
                            Profile
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={signOut}
                          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              <Link href="/">
                <DynamicLogo width={100} height={28} />
              </Link>
            </div>

            <div className="flex items-center space-x-2">
              {isAuthenticated && (
                <>
                  <Button variant="ghost" size="icon">
                    <Search className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                  </Button>
                </>
              )}
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Bottom Navigation */}
        {isAuthenticated && (
          <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t">
            <div className="flex items-center justify-around py-2 px-4">
              {navigationItems
                .filter((item) => item.showOnMobile)
                .slice(0, 4)
                .map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 min-w-0 flex-1",
                        active ? "text-primary bg-primary/10" : "text-muted-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="text-xs font-medium truncate">{item.name}</span>
                    </Link>
                  )
                })}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex flex-col items-center space-y-1 p-2 min-w-0"
              >
                <MoreHorizontal className="h-5 w-5" />
                <span className="text-xs font-medium">More</span>
              </Button>
            </div>
          </nav>
        )}
      </>
    )
  }

  // Desktop Navigation (≥ 1024px)
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <DynamicLogo width={120} height={32} />
          </Link>

          {/* Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center space-x-1">
              {navigationItems
                .filter((item) => item.category === "main")
                .map((item) => (
                  <NavigationLink key={item.name} item={item} />
                ))}
            </nav>
          )}

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <UserSection />
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <ThemeToggle />
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">Join Movement</Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default UnifiedNavigation
