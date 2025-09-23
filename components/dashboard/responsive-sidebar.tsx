"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
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
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  X,
  LogOut,
  User,
  MoreHorizontal,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { DynamicLogo } from "@/components/dynamic-logo"
import { CoinBalance } from "@/components/coin-balance"
import { UserTierBadge } from "@/components/user-tier-badge"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  description?: string
  category?: "main" | "secondary" | "settings"
}

// Updated sidebarItems: "Coins" item is removed.
const sidebarItems: SidebarItem[] = [
  {
    name: "Home",
    href: "/",
    icon: Home, // Main dashboard uses Home icon
    description: "Overview and stats",
    category: "main",
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home, // Main dashboard uses Home icon
    description: "Overview and stats",
    category: "main",
  },
  {
    name: "Community",
    href: "/community",
    icon: Users,
    badge: "New",
    description: "Connect with fans",
    category: "main",
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
  },
  // { // REMOVED this item
  //   name: "Coins",
  //   href: "/coins",
  //   icon: Coins,
  //   description: "Manage your coins",
  //   category: "secondary",
  // },
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

interface ResponsiveSidebarProps {
  children: React.ReactNode
}

type ScreenSize = "mobile" | "tablet" | "desktop" | "wide"
type SidebarMode = "collapsed" | "expanded" | "overlay" | "hidden"

export function ResponsiveSidebar({ children }: ResponsiveSidebarProps) {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("expanded")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [screenSize, setScreenSize] = useState<ScreenSize>("desktop")
  const [isHovered, setIsHovered] = useState(false)
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Screen size detection with debouncing
  const updateScreenSize = useCallback(() => {
    const width = window.innerWidth
    if (width < 640) {
      setScreenSize("mobile")
      setSidebarMode("hidden")
    } else if (width < 1024) {
      setScreenSize("tablet")
      setSidebarMode("overlay")
    } else if (width < 1440) {
      setScreenSize("desktop")
      setSidebarMode("expanded")
    } else {
      setScreenSize("wide")
      setSidebarMode("expanded")
    }
  }, [])

  useEffect(() => {
    updateScreenSize()

    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateScreenSize, 150)
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(timeoutId)
    }
  }, [updateScreenSize])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Handle orientation change
  useEffect(() => {
    const handleOrientationChange = () => {
      setTimeout(updateScreenSize, 100)
    }

    window.addEventListener("orientationchange", handleOrientationChange)
    return () => window.removeEventListener("orientationchange", handleOrientationChange)
  }, [updateScreenSize])

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname?.startsWith("/dashboard/")
    }
    return pathname?.startsWith(href)
  }

  const toggleSidebar = () => {
    if (screenSize === "desktop" || screenSize === "wide") {
      setSidebarMode(sidebarMode === "collapsed" ? "expanded" : "collapsed")
    } else {
      setIsMobileMenuOpen(!isMobileMenuOpen)
    }
  }

  const getSidebarWidth = () => {
    switch (sidebarMode) {
      case "collapsed":
        return "w-16"
      case "expanded":
        return screenSize === "wide" ? "w-80" : "w-64"
      case "overlay":
        return "w-64"
      default:
        return "w-0"
    }
  }

  const NavigationItem = ({ item, isCollapsed = false }: { item: SidebarItem; isCollapsed?: boolean }) => {
    const Icon = item.icon
    const active = isActive(item.href)

    const content = (
      <Link href={item.href} className="w-full">
        <Button
          variant={active ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start h-11 transition-all duration-200",
            isCollapsed && "justify-center px-2",
            active && "bg-primary/10 text-primary hover:bg-primary/20 shadow-sm",
            !active && "hover:bg-accent/50",
            "group relative",
          )}
        >
          <Icon className={cn("h-5 w-5 transition-all duration-200", !isCollapsed && "mr-3", active && "text-primary")} />
          {!isCollapsed && (
            <>
              <span className="truncate font-medium">{item.name}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0.5 bg-primary/20 text-primary">
                  {item.badge}
                </Badge>
              )}
            </>
          )}
          {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />}
        </Button>
      </Link>
    )

    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right" className="flex flex-col">
              <span className="font-medium">{item.name}</span>
              {item.description && <span className="text-xs text-muted-foreground">{item.description}</span>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return content
  }

  const UserSection = ({ isCollapsed = false }: { isCollapsed?: boolean }) => (
    <div className={cn("p-4 border-b", isCollapsed && "px-2")}>
      <div
        className={cn(
          "flex items-center transition-all duration-200",
          isCollapsed ? "flex-col space-y-2" : "space-x-3",
        )}
      >
        <Avatar className={`${isCollapsed ? 'h-8 w-8' : 'h-10 w-10'} flex-shrink-0`}>
          <AvatarImage src={profile?.profile_image_url || profile?.avatar_url || "/placeholder-user.jpg"} alt={profile?.username || "User"} />
          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold">
            {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>

        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate text-sm">{profile?.username || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <UserTierBadge tier={profile?.tier || "citizen"} size="sm" />
            </div>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="mt-3 p-2 bg-accent/30 rounded-lg">
          <CoinBalance coins={profile?.coins || 0} size="sm" />
        </div>
      )}

      {isCollapsed && (
        <div className="flex flex-col items-center space-y-1 mt-2">
          <div className="text-xs font-bold text-primary">{profile?.coins || 0}</div>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
      )}
    </div>
  )

  const ThemeToggle = ({ isCollapsed = false }: { isCollapsed?: boolean }) => (
    <div className={cn("p-4 border-t", isCollapsed && "px-2")}>
      {!isCollapsed ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Appearance</p>
          <div className="grid grid-cols-3 gap-1">
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
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full justify-center"
              >
                {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Toggle theme</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const isCollapsed = sidebarMode === "collapsed" && !isMobile
    const mainItems = sidebarItems.filter((item) => item.category === "main")
    const secondaryItems = sidebarItems.filter((item) => item.category === "secondary")
    const settingsItems = sidebarItems.filter((item) => item.category === "settings")

    return (
      <div className="flex flex-col h-full bg-card/50 backdrop-blur-sm">
        {/* Header */}
        <div className={cn("flex items-center p-4 border-b", isCollapsed && "justify-center px-2")}>
          {!isCollapsed ? (
            <Link href="/" className="flex items-center space-x-2">
              <DynamicLogo responsive={false} width={isMobile ? 120 : 100} height={isMobile ? 32 : 28} />
            </Link>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/">
                    <DynamicLogo responsive={false} width={32} height={32} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Erigga Citizen</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="ml-auto">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* User Section */}
        {user && profile && <UserSection isCollapsed={isCollapsed} />}

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3">
          <div className="py-4 space-y-6">
            {/* Main Navigation */}
            <div className="space-y-1">
              {!isCollapsed && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Main</p>
              )}
              {mainItems.map((item) => (
                <NavigationItem key={item.name} item={item} isCollapsed={isCollapsed} />
              ))}
            </div>

            {/* Secondary Navigation */}
            {secondaryItems.length > 0 && (
              <div className="space-y-1">
                {!isCollapsed && (
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                    Services
                  </p>
                )}
                {secondaryItems.map((item) => (
                  <NavigationItem key={item.name} item={item} isCollapsed={isCollapsed} />
                ))}
              </div>
            )}

            {/* Settings */}
            <div className="space-y-1">
              {!isCollapsed && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                  Account
                </p>
              )}
              {settingsItems.map((item) => (
                <NavigationItem key={item.name} item={item} isCollapsed={isCollapsed} />
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* Theme Toggle */}
        <ThemeToggle isCollapsed={isCollapsed} />

        {/* Footer Actions */}
        <div className={cn("p-4 border-t", isCollapsed && "px-2")}>
          {!isCollapsed ? (
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                <Link href="/profile">
                  {" "}
                  {/* Assuming /profile exists or will be created */}
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
          ) : (
            <div className="flex flex-col space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-center" asChild>
                      <Link href="/profile">
                        <User className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Profile</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={signOut}
                      className="w-full justify-center text-red-500 hover:text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Sign Out</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Collapse Toggle for Desktop */}
        {!isMobile && (screenSize === "desktop" || screenSize === "wide") && (
          <div className="p-2 border-t">
            <Button variant="ghost" size="sm" onClick={toggleSidebar} className="w-full justify-center hover:bg-accent">
              {sidebarMode === "collapsed" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      {(screenSize === "desktop" || screenSize === "wide") && sidebarMode !== "hidden" && (
        <div
          className={cn(
            "hidden lg:flex flex-col border-r transition-all duration-300 ease-in-out relative",
            getSidebarWidth(),
            "bg-card/30 backdrop-blur-sm",
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <SidebarContent />
        </div>
      )}

      {/* Tablet Overlay Sidebar */}
      {screenSize === "tablet" && (
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 lg:hidden bg-background/80 backdrop-blur-sm shadow-md"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SidebarContent isMobile />
          </SheetContent>
        </Sheet>
      )}

      {/* Mobile Bottom Navigation + Drawer */}
      {screenSize === "mobile" && (
        <>
          {/* Mobile Drawer */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm shadow-md rounded-full"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SidebarContent isMobile />
            </SheetContent>
          </Sheet>

          {/* Mobile Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t">
            <div className="flex items-center justify-around py-2 px-4">
              {sidebarItems
                .filter((item) => item.category === "main")
                .slice(0, 4)
                .map((item) => {
                  // Show first 4 main items
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors",
                        active ? "text-primary bg-primary/10" : "text-muted-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{item.name}</span>
                    </Link>
                  )
                })}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex flex-col items-center space-y-1 p-2"
              >
                <MoreHorizontal className="h-5 w-5" />
                <span className="text-xs font-medium">More</span>
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main
          className={cn(
            "flex-1 overflow-y-auto transition-all duration-300",
            screenSize === "mobile" ? "pb-20" : "p-4 lg:p-6", // Added padding-bottom for mobile to avoid overlap with bottom nav
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}