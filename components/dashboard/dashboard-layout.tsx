"use client"

import type React from "react"
<<<<<<< HEAD
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
=======

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Menu,
  Home,
  User,
  Coins,
  ShoppingBag,
  Calendar,
  Radio,
  ImageIcon,
  Crown,
  MessageSquare,
  LogOut,
  Settings,
  Ticket,
  Wallet,
  TrendingUp,
  Gamepad2,
  Video,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
>>>>>>> new

interface DashboardLayoutProps {
  children: React.ReactNode
}

<<<<<<< HEAD
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, profile, isLoading, isAuthenticated, isInitialized, navigationManager } = useAuth()
  const [retryCount, setRetryCount] = useState(0)
  const [showRetry, setShowRetry] = useState(false)

  // Handle retry logic
  useEffect(() => {
    if (!isLoading && !isAuthenticated && isInitialized && retryCount < 3) {
      const timer = setTimeout(() => {
        setShowRetry(true)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isLoading, isAuthenticated, isInitialized, retryCount])

  // Handle authentication redirect
  useEffect(() => {
    if (isInitialized && !isAuthenticated && !isLoading) {
      // If user is not authenticated after initialization, redirect to login
      const timer = setTimeout(() => {
        if (navigationManager) {
          navigationManager.handleAuthRequiredNavigation(window.location.pathname)
        }
      }, 3000) // Give 3 seconds for any pending auth operations

      return () => clearTimeout(timer)
    }
  }, [isInitialized, isAuthenticated, isLoading, navigationManager])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    setShowRetry(false)

    // Attempt to refresh the page or re-initialize auth
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  // Loading state during initialization
  if (!isInitialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-lime-500" />
            <div className="text-center space-y-2">
              <h3 className="font-semibold">Loading your dashboard</h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we prepare your personalized experience...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state - not authenticated after initialization
  if (isInitialized && !isAuthenticated && !isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle>Authentication Required</CardTitle>
            </div>
            <CardDescription>You need to be signed in to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>Redirecting you to the login page in a few seconds...</AlertDescription>
            </Alert>

            {showRetry && (
              <div className="flex flex-col space-y-2">
                <p className="text-sm text-muted-foreground">Taking longer than expected?</p>
                <Button onClick={handleRetry} variant="outline" className="w-full" disabled={retryCount >= 3}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {retryCount >= 3 ? "Max retries reached" : "Retry"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state - missing user data
  if (isAuthenticated && (!user || !profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle>Profile Error</CardTitle>
            </div>
            <CardDescription>There was an issue loading your profile data</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>Your session appears to be corrupted. Please sign in again.</AlertDescription>
            </Alert>
            <Button onClick={() => (window.location.href = "/login")} className="w-full mt-4">
              Sign In Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state - render dashboard without sidebar
  return (
    <div className="min-h-screen bg-background">
      <main className="w-full">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">{children}</div>
      </main>
=======
const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Vault", href: "/vault", icon: ImageIcon },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Wallet", href: "/wallet", icon: Wallet },
  { name: "Coins", href: "/coins", icon: Coins },
  { name: "Radio", href: "/radio", icon: Radio },
  { name: "Media", href: "/media", icon: Video },
  { name: "Community", href: "/community", icon: MessageSquare },
  { name: "Games", href: "/games", icon: Gamepad2 },
  { name: "Merch", href: "/merch", icon: ShoppingBag },
  { name: "Premium", href: "/premium", icon: Crown },
  { name: "Missions", href: "/missions", icon: TrendingUp },
  { name: "Settings", href: "/settings", icon: Settings },
]

const tierColors = {
  erigga_citizen: "bg-gray-500 text-white",
  erigga_indigen: "bg-brand-teal text-white",
  enterprise: "bg-brand-lime text-brand-teal",
}

const tierLabels = {
  erigga_citizen: "Citizen",
  erigga_indigen: "Indigen",
  enterprise: "Enterprise",
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=" + encodeURIComponent(pathname || "/dashboard"))
    }
  }, [user, router, pathname])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal"></div>
      </div>
    )
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname?.startsWith(href)
  }

  const userTier = (profile?.tier || "erigga_citizen") as keyof typeof tierColors
  const tierColor = tierColors[userTier] || tierColors.erigga_citizen
  const tierLabel = tierLabels[userTier] || tierLabels.erigga_citizen

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* User Profile Section */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.avatar_url || profile.profile_image_url || ""} alt={profile.username} />
            <AvatarFallback>{profile.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{profile.full_name || profile.username}</p>
            <p className="text-xs text-gray-500 truncate">@{profile.username}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Badge className={cn("text-xs", tierColor)}>{tierLabel}</Badge>
          <div className="flex items-center text-xs text-gray-600">
            <Coins className="h-3 w-3 mr-1" />
            <span>{profile.coins || 0}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <nav className="py-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all",
                  active
                    ? "bg-brand-teal text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                )}
                onClick={() => isMobile && setIsMobileMenuOpen(false)}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => {
            signOut()
            if (isMobile) setIsMobileMenuOpen(false)
            router.push("/")
          }}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 bg-white dark:bg-gray-800 border-r shadow-sm">
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 lg:hidden bg-white dark:bg-gray-800 shadow-md"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SidebarContent isMobile />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-6">{children}</div>
        </main>
      </div>
>>>>>>> new
    </div>
  )
}
