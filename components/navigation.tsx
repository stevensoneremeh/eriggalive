"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  Home,
  Users,
  MessageCircle,
  Coins,
  Crown,
  Radio,
  Target,
  BookOpen,
  Archive,
  Ticket,
  ShoppingBag,
  Menu,
  Settings,
  LogOut,
  User,
  Gamepad2,
  Sun,
  Moon,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "next-themes"
import { DynamicLogo } from "@/components/dynamic-logo"

const navigationItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/community", label: "Community", icon: Users },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/radio", label: "Radio", icon: Radio },
  { href: "/vault", label: "Vault", icon: Archive },
  { href: "/mission", label: "Mission", icon: Target },
  { href: "/chronicles", label: "Chronicles", icon: BookOpen },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/premium", label: "Premium", icon: Crown },
  { href: "/merch", label: "Merch", icon: ShoppingBag },
  { href: "/coins", label: "Coins", icon: Coins },
]

export function Navigation() {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { user, profile, isAuthenticated, signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (!mounted) {
    return null
  }

  // Don't show navigation on auth pages
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <DynamicLogo className="h-8 w-8" />
            <span className="hidden font-bold sm:inline-block">Erigga Live</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium flex-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 transition-colors hover:text-foreground/80 ${
                  isActive ? "text-foreground" : "text-foreground/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Desktop User Menu */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Theme Toggle */}
          <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {isAuthenticated && profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url || ""} alt="User" />
                    <AvatarFallback>{profile.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile.display_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">@{profile.username}</p>
                    <div className="flex items-center space-x-2 pt-1">
                      <Badge variant="secondary" className="text-xs">
                        {profile.subscription_tier}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Coins className="h-3 w-3" />
                        <span className="text-xs">{profile.coins_balance}</span>
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <SheetHeader>
              <SheetTitle>
                <Link href="/" className="flex items-center space-x-2">
                  <DynamicLogo className="h-6 w-6" />
                  <span className="font-bold">Erigga Live</span>
                </Link>
              </SheetTitle>
            </SheetHeader>

            <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
              <div className="flex flex-col space-y-3">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-foreground/80 ${
                        isActive ? "text-foreground" : "text-foreground/60"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>

              <Separator className="my-4" />

              {isAuthenticated && profile ? (
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar_url || ""} alt="User" />
                      <AvatarFallback>{profile.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{profile.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{profile.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {profile.subscription_tier}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Coins className="h-3 w-3" />
                      <span className="text-xs">{profile.coins_balance}</span>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-3">
                  <Link href="/login" className="flex items-center space-x-2 text-sm font-medium">
                    Sign In
                  </Link>
                  <Link href="/signup" className="flex items-center space-x-2 text-sm font-medium">
                    Sign Up
                  </Link>
                </div>
              )}

              <div className="pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="w-full justify-start"
                >
                  <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 ml-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="ml-6">Toggle theme</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
