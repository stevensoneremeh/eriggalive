"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DynamicLogo } from "@/components/dynamic-logo"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "next-themes"
import {
  Home,
  Users,
  Radio,
  ShoppingBag,
  Calendar,
  Coins,
  LogOut,
  Sun,
  Moon,
  Crown,
  Menu,
  Ticket,
  Archive,
  Shield,
} from "lucide-react"

const bottomNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/community", label: "Community", icon: Users },
  { href: "/radio", label: "Radio", icon: Radio },
  { href: "/merch", label: "Merch", icon: ShoppingBag },
  { href: "/meet-greet", label: "Meet", icon: Calendar },
]

const sideMenuItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/community", label: "Community", icon: Users },
  { href: "/radio", label: "Radio", icon: Radio },
  { href: "/merch", label: "Merch Store", icon: ShoppingBag },
  { href: "/meet-greet", label: "Meet & Greet", icon: Calendar },
  { href: "/coins", label: "Coins", icon: Coins },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/vault", label: "Vault", icon: Archive },
  { href: "/premium", label: "Premium", icon: Crown },
]

export function MobileNavigation() {
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
      setIsOpen(false)
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    }
    return profile?.username?.[0]?.toUpperCase() || "U"
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "blood_brotherhood":
        return "bg-red-600"
      case "elder":
        return "bg-purple-600"
      case "pioneer":
        return "bg-blue-600"
      case "grassroot":
        return "bg-green-600"
      default:
        return "bg-gray-600"
    }
  }

  return (
    <>
      {/* Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <DynamicLogo className="h-8 w-auto" />
        </Link>

        {/* Right Side */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Notifications */}
          {user && profile && <NotificationCenter />}

          {/* Menu Trigger */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                {user && profile ? (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url || ""} alt={profile.username} />
                    <AvatarFallback className={getTierColor(profile.tier)}>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <div className="flex flex-col h-full">
                {/* User Section */}
                {user && profile ? (
                  <div className="p-6 bg-slate-50 dark:bg-slate-800">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatar_url || ""} alt={profile.username} />
                        <AvatarFallback className={getTierColor(profile.tier)}>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{profile.full_name || profile.username}</h3>
                        <p className="text-sm text-muted-foreground">@{profile.username}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {profile.tier.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span>{profile.coins || 0} coins</span>
                      </div>
                      <div className="text-muted-foreground">Level {profile.level || 1}</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 dark:bg-slate-800">
                    <h3 className="font-semibold mb-2">Welcome!</h3>
                    <p className="text-sm text-muted-foreground mb-4">Sign in to access all features</p>
                    <div className="flex space-x-2">
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" size="sm">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/signup" onClick={() => setIsOpen(false)}>
                        <Button size="sm">Sign Up</Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Navigation Menu */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 space-y-2">
                    {sideMenuItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                            isActive(item.href)
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}

                    {/* Admin Section */}
                    {user && profile && (profile.role === "admin" || profile.role === "super_admin") && (
                      <>
                        <Separator className="my-4" />
                        <div className="px-3 py-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Admin</h4>
                        </div>
                        <Link
                          href="/admin"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Shield className="h-5 w-5" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                {user && profile && (
                  <div className="p-4 border-t">
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      disabled={isLoading}
                      className="w-full justify-start"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {isLoading ? "Signing out..." : "Sign Out"}
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700 z-40">
        <div className="flex items-center justify-around py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "fill-current" : ""}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom Spacer */}
      <div className="md:hidden h-20" />
    </>
  )
}
