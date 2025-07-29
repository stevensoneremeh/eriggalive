"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DynamicLogo } from "@/components/dynamic-logo"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { useTheme } from "next-themes"
import {
  Home,
  Users,
  Radio,
  Calendar,
  ShoppingBag,
  Coins,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Crown,
  Menu,
  Target,
} from "lucide-react"

const navigationItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Community", href: "/community", icon: Users },
  { name: "Radio", href: "/radio", icon: Radio },
  { name: "Meet & Greet", href: "/meet-greet", icon: Calendar },
  { name: "Merch", href: "/merch", icon: ShoppingBag },
  { name: "Mission", href: "/mission", icon: Target },
]

const bottomNavItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Community", href: "/community", icon: Users },
  { name: "Radio", href: "/radio", icon: Radio },
  { name: "Meet & Greet", href: "/meet-greet", icon: Calendar },
  { name: "Merch", href: "/merch", icon: ShoppingBag },
]

export function MobileNavigation() {
  const pathname = usePathname()
  const { user, profile, isAuthenticated, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood":
      case "blood_brotherhood":
        return "bg-red-500"
      case "elder":
        return "bg-purple-500"
      case "pioneer":
        return "bg-blue-500"
      case "grassroot":
        return "bg-green-500"
      case "general":
      default:
        return "bg-gray-500"
    }
  }

  const getTierDisplayName = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood":
      case "blood_brotherhood":
        return "Blood"
      case "elder":
        return "Elder"
      case "pioneer":
        return "Pioneer"
      case "grassroot":
        return "Grassroot"
      case "general":
      default:
        return "General"
    }
  }

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="md:hidden flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-0 z-50">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <DynamicLogo className="h-8 w-auto" />
        </Link>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          {isAuthenticated && <NotificationCenter />}

          {/* Menu Trigger */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              {isAuthenticated && profile ? (
                <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} alt={profile.username} />
                    <AvatarFallback className={`${getTierColor(profile.subscription_tier)} text-white text-xs`}>
                      {profile.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              ) : (
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              )}
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-left">
                  {isAuthenticated && profile ? (
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} alt={profile.username} />
                        <AvatarFallback className={`${getTierColor(profile.subscription_tier)} text-white`}>
                          {profile.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{profile.display_name || profile.username}</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            {getTierDisplayName(profile.subscription_tier)}
                          </Badge>
                          {profile.coins_balance !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              <Coins className="h-3 w-3 mr-1" />
                              {profile.coins_balance}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    "Menu"
                  )}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {/* Navigation Links */}
                <div className="space-y-2">
                  {navigationItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </div>

                <Separator />

                {/* User Actions */}
                {isAuthenticated && profile ? (
                  <div className="space-y-2">
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <User className="h-5 w-5" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <Settings className="h-5 w-5" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href="/coins"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <Coins className="h-5 w-5" />
                      <span>Coins</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium bg-accent text-accent-foreground"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}

                <Separator />

                {/* Theme Toggle */}
                <Button
                  variant="ghost"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-full justify-start"
                >
                  <Sun className="h-5 w-5 mr-3 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 ml-3 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="ml-6">Toggle theme</span>
                </Button>

                {/* Sign Out */}
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      signOut()
                      setIsMenuOpen(false)
                    }}
                    className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span>Sign out</span>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t z-40">
        <div className="flex items-center justify-around py-2">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom padding to prevent content from being hidden behind bottom nav */}
      <div className="md:hidden h-20" />
    </>
  )
}
