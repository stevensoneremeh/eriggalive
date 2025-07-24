"use client"

import { useState } from "react"
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Home,
  Users,
  MessageCircle,
  Radio,
  Music,
  Coins,
  ShoppingBag,
  Calendar,
  User,
  Settings,
  LogOut,
  Menu,
  Crown,
  Sparkles,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

const navigationItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Dashboard", href: "/dashboard", icon: User, requiresAuth: true },
  { name: "Community", href: "/community", icon: Users },
  { name: "Meet & Greet", href: "/meet-greet", icon: MessageCircle },
  { name: "Radio", href: "/radio", icon: Radio },
  { name: "Vault", href: "/vault", icon: Music, requiresAuth: true },
  { name: "Coins", href: "/coins", icon: Coins, requiresAuth: true },
  { name: "Merch", href: "/merch", icon: ShoppingBag },
  { name: "Chronicles", href: "/chronicles", icon: Calendar },
]

export function MainNavigation() {
  const { isAuthenticated, profile, signOut } = useAuth()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood_brotherhood":
      case "blood":
        return "bg-gradient-to-r from-red-500 to-red-600"
      case "elder":
        return "bg-gradient-to-r from-purple-500 to-purple-600"
      case "pioneer":
        return "bg-gradient-to-r from-blue-500 to-blue-600"
      case "grassroot":
        return "bg-gradient-to-r from-green-500 to-green-600"
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600"
    }
  }

  const getTierDisplayName = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood_brotherhood":
      case "blood":
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

  const filteredNavItems = navigationItems.filter((item) => !item.requiresAuth || isAuthenticated)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 rounded-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Erigga Live
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {filteredNavItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={pathname === item.href ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "flex items-center space-x-2",
                    pathname === item.href && "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Button>
              </Link>
            ))}
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 ring-2 ring-white/20">
                      <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} alt={profile.username} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {profile.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium leading-none">{profile.full_name || profile.username}</p>
                        <Badge className={`text-xs ${getTierColor(profile.tier)} text-white border-0`}>
                          <Crown className="h-3 w-3 mr-1" />
                          {getTierDisplayName(profile.tier)}
                        </Badge>
                      </div>
                      <p className="text-xs leading-none text-muted-foreground">@{profile.username}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Coins className="h-3 w-3 text-yellow-500" />
                        <span>{profile.coins_balance || 0} coins</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-6">
                  {isAuthenticated && profile && (
                    <div className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                      <Avatar className="h-12 w-12 ring-2 ring-white/20">
                        <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} alt={profile.username} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          {profile.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{profile.full_name || profile.username}</p>
                        <p className="text-sm text-muted-foreground">@{profile.username}</p>
                        <Badge className={`text-xs ${getTierColor(profile.tier)} text-white border-0 mt-1`}>
                          {getTierDisplayName(profile.tier)}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {filteredNavItems.map((item) => (
                      <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
                        <Button
                          variant={pathname === item.href ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start",
                            pathname === item.href && "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
                          )}
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.name}
                        </Button>
                      </Link>
                    ))}
                  </div>

                  {!isAuthenticated && (
                    <div className="space-y-2 pt-4 border-t">
                      <Button variant="ghost" className="w-full" asChild>
                        <Link href="/login" onClick={() => setIsOpen(false)}>
                          Sign In
                        </Link>
                      </Button>
                      <Button
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        asChild
                      >
                        <Link href="/signup" onClick={() => setIsOpen(false)}>
                          Sign Up
                        </Link>
                      </Button>
                    </div>
                  )}

                  {isAuthenticated && (
                    <div className="pt-4 border-t">
                      <Button variant="ghost" className="w-full text-red-600" onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
