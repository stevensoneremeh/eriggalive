"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import {
  Menu,
  Home,
  Users,
  Music,
  DollarSign,
  Radio,
  ShoppingBag,
  LogOut,
  Settings,
  User,
  Shield,
  Crown,
  Zap,
  Star,
  Flame,
} from "lucide-react"
import { DynamicLogo } from "@/components/dynamic-logo"

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Community", href: "/community", icon: Users },
  { name: "Vault", href: "/vault", icon: Music },
  { name: "Coins", href: "/coins", icon: DollarSign },
  { name: "Radio", href: "/radio", icon: Radio },
  { name: "Merch", href: "/merch", icon: ShoppingBag },
]

const getTierIcon = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case "blood":
    case "blood_brotherhood":
      return Flame
    case "elder":
      return Crown
    case "pioneer":
      return Zap
    case "grassroot":
      return Star
    default:
      return User
  }
}

const getTierColor = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case "blood":
    case "blood_brotherhood":
      return "text-red-500"
    case "elder":
      return "text-purple-500"
    case "pioneer":
      return "text-blue-500"
    case "grassroot":
      return "text-green-500"
    default:
      return "text-gray-500"
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
    default:
      return "Fan"
  }
}

export function MainNavigation() {
  const pathname = usePathname()
  const { user, profile, signOut, loading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  // Don't render navigation on auth pages
  if (pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/forgot-password")) {
    return null
  }

  const isAdmin = user?.email === "admin@eriggalive.com"
  const TierIcon = getTierIcon(profile?.tier || "grassroot")

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <DynamicLogo />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-6 md:ml-8">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>

        {/* Right side - User menu or auth buttons */}
        <div className="ml-auto flex items-center space-x-4">
          {loading ? (
            <div className="h-8 w-8 animate-pulse bg-muted rounded-full" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={profile?.avatar_url || "/placeholder-user.jpg"}
                      alt={profile?.username || "User"}
                    />
                    <AvatarFallback>{profile?.username?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.display_name || profile?.username || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <TierIcon className={cn("h-3 w-3 mr-1", getTierColor(profile?.tier || "grassroot"))} />
                        {getTierDisplayName(profile?.tier || "grassroot")}
                      </Badge>
                      {profile?.coins_balance !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          {profile.coins_balance} coins
                        </Badge>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center text-orange-600 dark:text-orange-400">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-red-600 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-6">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        pathname === item.href
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}

                {user && (
                  <>
                    <div className="border-t pt-4 mt-4">
                      <Link
                        href="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      >
                        <User className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                      <Link
                        href="/profile/settings"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md text-orange-600 dark:text-orange-400 hover:bg-accent/50"
                        >
                          <Shield className="h-4 w-4" />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setIsOpen(false)
                          signOut()
                        }}
                        className="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md text-red-600 dark:text-red-400 hover:bg-accent/50 w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
