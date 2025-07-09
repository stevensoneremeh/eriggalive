"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Menu,
  X,
  Home,
  Users,
  BookOpen,
  Music,
  LayoutDashboard,
  Ticket,
  Crown,
  ShoppingBag,
  LogOut,
  LogIn,
  Sun,
  Moon,
  Monitor,
  Settings,
  CreditCard,
  Bell,
  Search,
  MessageCircle,
  Gift,
  Radio,
  Coins,
  UserPlus,
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
  showInMobile?: boolean
  requiresAuth?: boolean
  description?: string
}

const publicNavigationItems: NavigationItem[] = [
  {
    name: "Home",
    href: "/",
    icon: Home,
    showInMobile: true,
    requiresAuth: false,
    description: "Welcome to Erigga Live",
  },
  {
    name: "Community",
    href: "/community",
    icon: Users,
    badge: "Hot",
    showInMobile: true,
    requiresAuth: false,
    description: "Join the conversation",
  },
  {
    name: "Media Vault",
    href: "/vault",
    icon: Music,
    showInMobile: true,
    requiresAuth: false,
    description: "Music, videos & exclusive content",
  },
  {
    name: "Chronicles",
    href: "/chronicles",
    icon: BookOpen,
    showInMobile: false,
    requiresAuth: false,
    description: "Stories and updates",
  },
  {
    name: "Live Radio",
    href: "/radio",
    icon: Radio,
    showInMobile: false,
    requiresAuth: false,
    description: "24/7 Erigga Radio",
  },
]

const authenticatedNavigationItems: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    showInMobile: true,
    requiresAuth: true,
    description: "Your personal space",
  },
  {
    name: "Chat Rooms",
    href: "/chat",
    icon: MessageCircle,
    showInMobile: true,
    requiresAuth: true,
    description: "Connect with fans",
  },
  {
    name: "Freebies",
    href: "/rooms/freebies",
    icon: Gift,
    showInMobile: false,
    requiresAuth: true,
    description: "Free content & giveaways",
  },
]

const premiumNavigationItems: NavigationItem[] = [
  {
    name: "Tickets",
    href: "/tickets",
    icon: Ticket,
    showInMobile: false,
    requiresAuth: false,
    description: "Concert & event tickets",
  },
  {
    name: "Premium",
    href: "/premium",
    icon: Crown,
    showInMobile: false,
    requiresAuth: false,
    description: "Upgrade your experience",
  },
  {
    name: "Merch Store",
    href: "/merch",
    icon: ShoppingBag,
    showInMobile: false,
    requiresAuth: false,
    description: "Official merchandise",
  },
]

type ScreenSize = "mobile" | "tablet" | "desktop"

export function MainNavigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [screenSize, setScreenSize] = useState<ScreenSize>("desktop")
  const [mounted, setMounted] = useState(false)

  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut, isAuthenticated, isLoading } = useAuth()
  const { theme, setTheme } = useTheme()

  // Screen size detection
  const updateScreenSize = useCallback(() => {
    if (typeof window === "undefined") return
    const width = window.innerWidth
    if (width < 768) {
      setScreenSize("mobile")
    } else if (width < 1024) {
      setScreenSize("tablet")
    } else {
      setScreenSize("desktop")
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    updateScreenSize()

    const handleResize = () => updateScreenSize()
    const handleScroll = () => {
      if (typeof window !== "undefined") {
        setIsScrolled(window.scrollY > 10)
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize)
      window.addEventListener("scroll", handleScroll)

      return () => {
        window.removeEventListener("resize", handleResize)
        window.removeEventListener("scroll", handleScroll)
      }
    }
  }, [updateScreenSize])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/"
    }
    return pathname?.startsWith(path)
  }

  const getAllNavigationItems = () => {
    let items = [...publicNavigationItems]

    if (isAuthenticated) {
      items = [...items, ...authenticatedNavigationItems]
    }

    items = [...items, ...premiumNavigationItems]

    return items
  }

  const getMobileItems = () => {
    return getAllNavigationItems().filter((item) => item.showInMobile)
  }

  const handleNavigation = (href: string) => {
    router.push(href)
    setIsMobileMenuOpen(false)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsMobileMenuOpen(false)
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  if (!mounted) {
    return <NavigationSkeleton />
  }

  // Mobile Navigation
  if (screenSize === "mobile") {
    return (
      <>
        {/* Top Header for Mobile */}
        <header
          className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
            isScrolled ? "bg-background/95 backdrop-blur-md shadow-lg" : "bg-background/80 backdrop-blur-sm",
          )}
        >
          <div className="flex items-center justify-between px-4 h-14">
            <Link href="/" className="flex items-center">
              <DynamicLogo width={100} height={28} />
            </Link>

            <div className="flex items-center space-x-2">
              {isAuthenticated && (
                <>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                    <Bell className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                  </Button>
                </>
              )}

              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0">
                  <MobileMenuContent />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/50">
          <div className="flex items-center justify-around py-2 px-2">
            {getMobileItems()
              .slice(0, 4)
              .map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 min-w-[60px]",
                      active
                        ? "text-primary bg-primary/10 scale-105"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                    )}
                  >
                    <div className="relative">
                      <Icon className="h-5 w-5" />
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs bg-red-500 text-white"
                        >
                          {typeof item.badge === "number" && item.badge > 9 ? "9+" : item.badge}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs font-medium truncate">{item.name}</span>
                  </Link>
                )
              })}

            <Button
              variant="ghost"
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex flex-col items-center space-y-1 p-2 rounded-lg min-w-[60px] h-auto"
            >
              <Menu className="h-5 w-5" />
              <span className="text-xs font-medium">More</span>
            </Button>
          </div>
        </nav>
      </>
    )
  }

  // Desktop Navigation
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-background/95 backdrop-blur-md shadow-lg" : "bg-background/80 backdrop-blur-sm",
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 w-full">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <DynamicLogo width={120} height={32} />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 flex-1 justify-center max-w-4xl">
            {getAllNavigationItems().map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "relative px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 group",
                    active
                      ? "text-primary bg-primary/10 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  <span className="flex items-center space-x-1">
                    <span>{item.name}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs bg-red-500 text-white">
                        {item.badge}
                      </Badge>
                    )}
                  </span>
                  {item.description && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.description}
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Theme Toggle */}
            <div className="hidden md:flex items-center space-x-1 mr-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme("light")}
                className={cn(
                  "p-2 transition-all duration-200",
                  theme === "light" && "bg-accent text-accent-foreground",
                )}
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
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </div>

            {/* User Actions */}
            {!isLoading && (
              <>
                {isAuthenticated && profile ? (
                  <>
                    <div className="hidden md:flex items-center space-x-2">
                      <CoinBalance coins={profile.coins_balance || 0} size="sm" />
                      <UserTierBadge tier={profile.subscription_tier || "general"} />
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {profile.username?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{profile.username}</p>
                            <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleNavigation("/dashboard")}>
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigation("/coins")}>
                          <Coins className="mr-2 h-4 w-4" />
                          Manage Coins
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigation("/settings")}>
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}

            {/* Tablet Hamburger Menu */}
            {screenSize === "tablet" && (
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0">
                  <MobileMenuContent />
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </header>
  )

  // Mobile Menu Content Component
  function MobileMenuContent() {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
            <DynamicLogo width={100} height={28} />
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* User Info */}
        {isAuthenticated && profile && (
          <div className="p-4 border-b bg-accent/20">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {profile.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-sm">{profile.username || "User"}</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
                <UserTierBadge tier={profile.subscription_tier || "general"} size="sm" className="mt-1" />
              </div>
            </div>
            <div className="bg-background/50 rounded-lg p-2">
              <CoinBalance coins={profile.coins_balance || 0} size="sm" />
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {getAllNavigationItems().map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 w-full text-left",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <div className="flex-1">
                    <span className="font-medium">{item.name}</span>
                    {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs bg-red-500 text-white">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="p-4 border-t">
          <div className="mb-4">
            <p className="text-sm font-medium mb-3">Appearance</p>
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

          {/* Auth Actions */}
          {isAuthenticated ? (
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => handleNavigation("/coins")}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Coins
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => handleNavigation("/settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500 hover:text-red-600"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => handleNavigation("/login")}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
              <Button
                className="w-full justify-start bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                onClick={() => handleNavigation("/signup")}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }
}

// Navigation Skeleton
function NavigationSkeleton() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="hidden lg:flex items-center space-x-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 w-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </header>
  )
}
