"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Crown,
  Ticket,
  Archive,
  Shield,
} from "lucide-react"

const navigationItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/community", label: "Community", icon: Users },
  { href: "/radio", label: "Radio", icon: Radio },
  { href: "/merch", label: "Merch", icon: ShoppingBag },
  { href: "/meet-greet", label: "Meet & Greet", icon: Calendar },
]

const userMenuItems = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/coins", label: "Coins", icon: Coins },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/vault", label: "Vault", icon: Archive },
  { href: "/premium", label: "Premium", icon: Crown },
]

const adminMenuItems = [
  { href: "/admin", label: "Admin Dashboard", icon: Shield },
  { href: "/admin/health", label: "System Health", icon: Settings },
]

export function DesktopNavigation() {
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
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
    <nav className="hidden md:flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center space-x-2">
        <DynamicLogo className="h-10 w-auto" />
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center space-x-1">
        {navigationItems.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive(item.href) ? "default" : "ghost"}
                className="flex items-center space-x-2 px-4 py-2"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            </Link>
          )
        })}
      </div>

      {/* Right Side - Auth & User Menu */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {user && profile ? (
          <>
            {/* Notifications */}
            <NotificationCenter />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.avatar_url || ""} alt={profile.username} />
                    <AvatarFallback className={getTierColor(profile.tier)}>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  {profile.tier !== "grassroot" && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      <Crown className="h-3 w-3" />
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{profile.full_name || profile.username}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">@{profile.username}</p>
                    <Badge variant="outline" className="w-fit text-xs">
                      {profile.tier.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <DropdownMenuSeparator />

                {userMenuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  )
                })}

                {(profile.role === "admin" || profile.role === "super_admin") && (
                  <>
                    <DropdownMenuSeparator />
                    {adminMenuItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link href={item.href} className="flex items-center space-x-2">
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      )
                    })}
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} disabled={isLoading}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>{isLoading ? "Signing out..." : "Sign out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <div className="flex items-center space-x-2">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
