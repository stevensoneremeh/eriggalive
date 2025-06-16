"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Menu,
  Home,
  Users,
  BookOpen,
  Music,
  Coins,
  Ticket,
  Crown,
  ShoppingBag,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { DynamicLogo } from "@/components/dynamic-logo"
import { CoinBalance } from "@/components/coin-balance"
import { UserTierBadge } from "@/components/user-tier-badge"
import { cn } from "@/lib/utils"

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

const sidebarItems: SidebarItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Community", href: "/community", icon: Users },
  { name: "Chronicles", href: "/chronicles", icon: BookOpen },
  { name: "Media Vault", href: "/vault", icon: Music },
  { name: "Coins", href: "/coins", icon: Coins },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Premium", href: "/premium", icon: Crown },
  { name: "Merch", href: "/merch", icon: ShoppingBag },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface ResponsiveSidebarProps {
  children: React.ReactNode
}

export function ResponsiveSidebar({ children }: ResponsiveSidebarProps) {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const { user, profile } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()

  // Detect mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false)
      }
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname?.startsWith(href)
  }

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn("flex items-center p-4", isDesktopCollapsed && !isMobile && "justify-center")}>
        {(!isDesktopCollapsed || isMobile) && (
          <Link href="/" className="flex items-center space-x-2">
            <DynamicLogo width={isMobile ? 120 : 100} height={isMobile ? 32 : 28} />
          </Link>
        )}
        {isDesktopCollapsed && !isMobile && (
          <Link href="/">
            <DynamicLogo width={32} height={32} />
          </Link>
        )}
      </div>

      <Separator />

      {/* User Info */}
      {user && profile && (
        <>
          <div className={cn("p-4", isDesktopCollapsed && !isMobile && "px-2")}>
            <div
              className={cn(
                "flex items-center space-x-3",
                isDesktopCollapsed && !isMobile && "flex-col space-x-0 space-y-2",
              )}
            >
              <Avatar className={cn("h-10 w-10", isDesktopCollapsed && !isMobile && "h-8 w-8")}>
                <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} alt={profile.username} />
                <AvatarFallback>
                  {profile.username?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {(!isDesktopCollapsed || isMobile) && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{profile.username || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                </div>
              )}
            </div>
            {(!isDesktopCollapsed || isMobile) && (
              <div className="flex items-center justify-between mt-3">
                <CoinBalance coins={profile.coins} size="sm" />
                <UserTierBadge tier={profile.tier} />
              </div>
            )}
            {isDesktopCollapsed && !isMobile && (
              <div className="flex flex-col items-center space-y-1 mt-2">
                <div className="text-xs font-medium">{profile.coins}</div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
            )}
          </div>
          <Separator />
        </>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 py-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-10",
                    isDesktopCollapsed && !isMobile && "justify-center px-2",
                    active && "bg-primary/10 text-primary hover:bg-primary/20",
                  )}
                >
                  <Icon className={cn("h-4 w-4", (!isDesktopCollapsed || isMobile) && "mr-2")} />
                  {(!isDesktopCollapsed || isMobile) && (
                    <>
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              </Link>
            )
          })}
        </div>
      </ScrollArea>

      <Separator />

      {/* Theme Toggle */}
      <div className={cn("p-4", isDesktopCollapsed && !isMobile && "px-2")}>
        {(!isDesktopCollapsed || isMobile) && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Theme</p>
            <div className="flex space-x-1">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="flex-1"
              >
                <Sun className="h-3 w-3 mr-1" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="flex-1"
              >
                <Moon className="h-3 w-3 mr-1" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
                className="flex-1"
              >
                <Monitor className="h-3 w-3 mr-1" />
                Auto
              </Button>
            </div>
          </div>
        )}
        {isDesktopCollapsed && !isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full justify-center"
          >
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden lg:flex flex-col border-r bg-card transition-all duration-300 ease-in-out",
          isDesktopCollapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent />

        {/* Collapse Toggle */}
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className="w-full justify-center"
          >
            {isDesktopCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <SidebarContent isMobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
