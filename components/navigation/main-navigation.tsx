"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
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
import { useAuth } from "@/contexts/auth-context"
import { useRadio } from "@/contexts/radio-context"
import { cn } from "@/lib/utils"
import {
  Menu,
  X,
  Home,
  Users,
  ShoppingBag,
  Calendar,
  MessageCircle,
  Coins,
  User,
  Settings,
  LogOut,
  Radio,
  Gift,
  Vault,
} from "lucide-react"
import { DynamicLogo } from "@/components/dynamic-logo"

const navigationItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Community", href: "/community", icon: Users },
  { name: "Media Vault", href: "/vault", icon: Vault },
  { name: "Merch Store", href: "/merch", icon: ShoppingBag },
  { name: "Chronicles", href: "/chronicles", icon: Calendar },
  { name: "Chat Rooms", href: "/chat", icon: MessageCircle, requiresAuth: true },
  { name: "Freebies", href: "/rooms/freebies", icon: Gift, requiresAuth: true },
  { name: "Coins", href: "/coins", icon: Coins, requiresAuth: true },
]

export function MainNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, isAuthenticated, signOut, isLoading } = useAuth()
  const { isPlaying, currentMood, toggleRadio } = useRadio()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood_brotherhood":
      case "blood":
        return "bg-red-500 text-white"
      case "elder":
        return "bg-purple-500 text-white"
      case "pioneer":
        return "bg-blue-500 text-white"
      case "grassroot":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
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

  if (!mounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <DynamicLogo />
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <DynamicLogo />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => {
              if (item.requiresAuth && !isAuthenticated) return null

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}

            {/* Radio Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleRadio}
              className={cn("flex items-center space-x-1", isPlaying && "text-green-500")}
            >
              <Radio className="h-4 w-4" />
              {isPlaying && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
              <span className="hidden lg:inline">Radio</span>
            </Button>
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              </div>
            ) : isAuthenticated && profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 h-auto p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-medium">{profile.username}</span>
                      <Badge className={cn("text-xs", getTierColor(profile.subscription_tier))}>
                        {getTierDisplayName(profile.subscription_tier)}
                      </Badge>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col">
                    <span>{profile.full_name || profile.username}</span>
                    <span className="text-xs text-muted-foreground font-normal">{profile.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/coins" className="flex items-center">
                      <Coins className="mr-2 h-4 w-4" />
                      Coins ({profile.coins_balance || 0})
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
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

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex items-center justify-between mb-6">
                  <DynamicLogo />
                  <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {navigationItems.map((item) => {
                    if (item.requiresAuth && !isAuthenticated) return null

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          pathname === item.href
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted",
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}

                  <Button
                    variant="ghost"
                    onClick={() => {
                      toggleRadio()
                      setIsOpen(false)
                    }}
                    className={cn("w-full justify-start space-x-3 px-3 py-2", isPlaying && "text-green-500")}
                  >
                    <Radio className="h-5 w-5" />
                    <span>Radio</span>
                    {isPlaying && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-auto" />}
                  </Button>

                  {isAuthenticated && profile && (
                    <>
                      <div className="border-t pt-4 mt-4">
                        <div className="flex items-center space-x-3 px-3 py-2 mb-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                            <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{profile.username}</p>
                            <Badge className={cn("text-xs", getTierColor(profile.subscription_tier))}>
                              {getTierDisplayName(profile.subscription_tier)}
                            </Badge>
                          </div>
                        </div>

                        <Link
                          href="/dashboard"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <User className="h-5 w-5" />
                          <span>Dashboard</span>
                        </Link>

                        <Link
                          href="/coins"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Coins className="h-5 w-5" />
                          <span>Coins ({profile.coins_balance || 0})</span>
                        </Link>

                        <Button
                          variant="ghost"
                          onClick={() => {
                            handleSignOut()
                            setIsOpen(false)
                          }}
                          className="w-full justify-start space-x-3 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <LogOut className="h-5 w-5" />
                          <span>Sign Out</span>
                        </Button>
                      </div>
                    </>
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
