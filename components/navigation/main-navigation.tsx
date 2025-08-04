"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Menu,
  Home,
  Users,
  Vault,
  Coins,
  Calendar,
  MessageSquare,
  ShoppingBag,
  Crown,
  Phone,
  BookOpen,
  Settings,
  LogOut,
  User,
  Moon,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"

const navigationItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Dashboard", href: "/dashboard", icon: User, requireAuth: true },
  { name: "Community", href: "/community", icon: Users, requireAuth: true },
  { name: "Vault", href: "/vault", icon: Vault, requireAuth: true },
  { name: "Coins", href: "/coins", icon: Coins, requireAuth: true },
  { name: "Chronicles", href: "/chronicles", icon: BookOpen, requireAuth: true },
  { name: "Tickets", href: "/tickets", icon: Calendar, requireAuth: true },
  { name: "Chat", href: "/chat", icon: MessageSquare, requireAuth: true },
  { name: "Merch", href: "/merch", icon: ShoppingBag, requireAuth: true },
  { name: "Premium", href: "/premium", icon: Crown },
  { name: "Meet & Greet", href: "/meet-and-greet", icon: Phone, requireAuth: true },
]

export function MainNavigation() {
  const { user, profile, signOut, loading, isAuthenticated } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "blood":
        return "bg-red-500 text-white"
      case "elder":
        return "bg-yellow-500 text-black"
      case "pioneer":
        return "bg-orange-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const filteredNavItems = navigationItems.filter((item) => !item.requireAuth || isAuthenticated)

  if (loading) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">EL</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Erigga Live
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {filteredNavItems.slice(0, 6).map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`flex items-center space-x-2 ${
                      isActive
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            {mounted && (
              <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}

            {/* User Menu or Auth Buttons */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || ""} alt={profile?.username || ""} />
                      <AvatarFallback>
                        {getInitials(profile?.full_name || profile?.username || user?.email || "U")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.full_name || profile?.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      <Badge className={`w-fit text-xs ${getTierColor(profile?.tier || "grassroot")}`}>
                        {profile?.tier?.toUpperCase() || "GRASSROOT"}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  {filteredNavItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                      <Link key={item.name} href={item.href}>
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          className={`w-full justify-start ${
                            isActive ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white" : ""
                          }`}
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {item.name}
                        </Button>
                      </Link>
                    )
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
