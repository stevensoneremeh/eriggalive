"use client"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  LayoutDashboard,
  Music,
  MessageSquare,
  Ticket,
  ShoppingBag,
  FileText,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  LogOut,
  User,
  Coins,
  Crown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { CoinBalance } from "@/components/coin-balance"
import { DynamicLogo } from "@/components/dynamic-logo"

interface SidebarProps {
  className?: string
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Media Vault", href: "/vault", icon: Music },
  { name: "Community", href: "/community", icon: MessageSquare },
  { name: "Events", href: "/tickets", icon: Ticket },
  { name: "Merch", href: "/merch", icon: ShoppingBag },
  { name: "Chronicles", href: "/chronicles", icon: FileText },
  { name: "Coins", href: "/coins", icon: Coins },
  { name: "Premium", href: "/premium", icon: Crown },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function ResponsiveSidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const { profile, signOut, isLoading } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname?.startsWith(path)
  }

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <div className={cn("flex items-center", isCollapsed && !mobile && "justify-center")}>
          <DynamicLogo width={isCollapsed && !mobile ? 32 : 120} height={32} className="transition-all duration-300" />
        </div>
        {!mobile && (
          <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="h-8 w-8">
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
        {mobile && (
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* User Profile */}
      {profile && (
        <div className="p-4 border-b">
          <div className={cn("flex items-center space-x-3", isCollapsed && !mobile && "justify-center")}>
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>{profile.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {(!isCollapsed || mobile) && (
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{profile.username}</div>
                <Badge variant="outline" className="text-xs mt-1">
                  {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)}
                </Badge>
              </div>
            )}
          </div>
          {(!isCollapsed || mobile) && (
            <div className="mt-3">
              <CoinBalance size="sm" />
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  "hover:bg-accent hover:text-accent-foreground",
                  active && "bg-primary text-primary-foreground shadow-sm",
                  isCollapsed && !mobile && "justify-center px-2",
                )}
                title={isCollapsed && !mobile ? item.name : undefined}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", (!isCollapsed || mobile) && "mr-3")} />
                {(!isCollapsed || mobile) && <span className="truncate">{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Theme Toggle */}
      <div className="p-4 border-t">
        {(!isCollapsed || mobile) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="theme-toggle" className="text-sm font-medium">
                Theme
              </Label>
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4" />
                <Switch
                  id="theme-toggle"
                  checked={resolvedTheme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
                <Moon className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="flex-1"
              >
                <Sun className="h-4 w-4 mr-1" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="flex-1"
              >
                <Moon className="h-4 w-4 mr-1" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
                className="flex-1"
              >
                <Monitor className="h-4 w-4 mr-1" />
                Auto
              </Button>
            </div>
          </div>
        )}
        {isCollapsed && !mobile && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              title="Toggle theme"
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        {(!isCollapsed || mobile) && (
          <div className="space-y-2">
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
        {isCollapsed && !mobile && (
          <div className="flex flex-col space-y-2">
            <Button variant="ghost" size="icon" asChild title="Profile">
              <Link href="/profile">
                <User className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              title="Sign Out"
              className="text-red-500 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex h-screen w-64 flex-col border-r bg-background">
        <div className="flex h-16 items-center justify-center border-b">
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SidebarContent mobile />
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div
          className={cn(
            "flex h-screen flex-col border-r bg-background transition-all duration-300",
            isCollapsed ? "w-16" : "w-64",
            className,
          )}
        >
          <SidebarContent />
        </div>
      )}
    </>
  )
}
