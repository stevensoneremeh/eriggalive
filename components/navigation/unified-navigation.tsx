"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Menu,
  Home,
  Target,
  Music,
  Coins,
  MessageCircle,
  User,
  Settings,
  LogOut,
  Crown,
  Phone,
  ShoppingBag,
  Calendar,
  Radio,
  Ticket,
  Info,
  LayoutDashboard,
  Wallet,
  X,
  Sun,
  Moon,
  Monitor,
  Users,
  Gamepad2,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { DynamicLogo } from "@/components/dynamic-logo"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const navigationItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Community", href: "/community", icon: Users },
  { name: "Media", href: "/missions", icon: Target },
  { name: "Games", href: "/games", icon: Gamepad2 },
  { name: "Radio", href: "/radio", icon: Radio },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Vault", href: "/vault", icon: Music },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Chat", href: "/chat", icon: MessageCircle },
  { name: "Meet & Greet", href: "/meet-and-greet", icon: Phone },
  { name: "Merch", href: "/merch", icon: ShoppingBag },
  { name: "Chronicles", href: "/chronicles", icon: Calendar },
  { name: "Coins", href: "/coins", icon: Coins },
  { name: "Wallet", href: "/wallet", icon: Wallet },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "About", href: "/about", icon: Info },
]

export function UnifiedNavigation() {
  const { user, profile, signOut } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const getDesktopNavItems = () => {
    if (user) {
      return [
        { name: "Home", href: "/", icon: Home },
        { name: "Community", href: "/community", icon: Users },
        { name: "Media", href: "/missions", icon: Target },
        { name: "Games", href: "/games", icon: Gamepad2 },
        { name: "Radio", href: "/radio", icon: Radio },
        { name: "Events", href: "/events", icon: Calendar },
        { name: "Vault", href: "/vault", icon: Music },
        { name: "Merch", href: "/merch", icon: ShoppingBag },
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Wallet", href: "/wallet", icon: Wallet },
      ]
    } else {
      return [
        { name: "Home", href: "/", icon: Home },
        { name: "Community", href: "/community", icon: Users },
        { name: "Media", href: "/missions", icon: Target },
        { name: "Games", href: "/games", icon: Gamepad2 },
        { name: "Radio", href: "/radio", icon: Radio },
        { name: "Events", href: "/events", icon: Calendar },
        { name: "Vault", href: "/vault", icon: Music },
        { name: "Merch", href: "/merch", icon: ShoppingBag },
        { name: "About", href: "/about", icon: Info },
      ]
    }
  }

  const getMobileNavItems = () => {
    return navigationItems
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "free":
      case "erigga_citizen":
        return "bg-green-100 text-green-800 border-green-200"
      case "pro":
      case "erigga_indigen":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "ent":
      case "enterprise":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-green-100 text-green-800 border-green-200"
    }
  }

  const getTierDisplayName = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "free":
      case "erigga_citizen":
        return "ERIGGA CITIZEN"
      case "pro":
      case "erigga_indigen":
        return "ERIGGA INDIGEN"
      case "ent":
      case "enterprise":
        return "E"
      default:
        return "ERIGGA CITIZEN"
    }
  }

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-lg dark:bg-gray-950/95"
          : "bg-background/80 backdrop-blur-sm dark:bg-gray-950/80",
      )}
    >
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <DynamicLogo responsive={true} className="h-6 w-auto sm:h-8" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center max-w-2xl">
            {getDesktopNavItems().map((item) => {
              const isActive =
                pathname === item.href || (item.href === "/dashboard" && pathname?.startsWith("/dashboard"))
              return (
                <Button
                  key={item.name}
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "flex items-center space-x-2 transition-all duration-200",
                    isActive ? "bg-lime-500 text-teal-900 hover:bg-lime-600" : "hover:bg-accent",
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span className="hidden xl:inline">{item.name}</span>
                  </Link>
                </Button>
              )
            })}
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
            {user ? (
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                {profile?.coins !== undefined && (
                  <div className="hidden sm:flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/20 px-2 md:px-3 py-1 rounded-full">
                    <Coins className="h-3 w-3 md:h-4 md:w-4 text-yellow-600" />
                    <span className="text-xs md:text-sm font-medium text-yellow-700 dark:text-yellow-400">
                      {profile.coins.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 rounded-full p-0">
                      <Avatar className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10">
                        <AvatarImage
                          src={
                            (profile as any)?.profile_image_url ||
                            (profile as any)?.avatar_url ||
                            "/placeholder-user.jpg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg"
                          }
                          alt={(profile as any)?.username || "User"}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-xs sm:text-sm">
                          {profile?.full_name?.charAt(0) ||
                            profile?.username?.charAt(0) ||
                            user?.email?.charAt(0) ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{profile?.full_name || profile?.username || "User"}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                        {profile?.tier && (
                          <Badge className={`w-fit text-xs ${getTierColor(profile.tier)}`}>
                            <Crown className="w-3 h-3 mr-1" />
                            {getTierDisplayName(profile.tier)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wallet" className="flex items-center">
                        <Wallet className="mr-2 h-4 w-4" />
                        <span>Wallet</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="bg-lime-500 text-teal-900 hover:bg-lime-600">
                  <Link href="/signup">Join Now</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 p-0">
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px] p-0 bg-background/95 backdrop-blur-md">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <DynamicLogo responsive={false} className="h-8 w-auto" />
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* User Info in Mobile */}
                  {user && (
                    <div className="flex items-center space-x-3 p-4 bg-muted/30 backdrop-blur-sm">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={
                            (profile as any)?.profile_image_url ||
                            (profile as any)?.avatar_url ||
                            "/placeholder-user.jpg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg"
                          }
                          alt={(profile as any)?.username || "User"}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold">
                          {profile?.full_name?.charAt(0) ||
                            profile?.username?.charAt(0) ||
                            user?.email?.charAt(0) ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {(profile as any)?.full_name || (profile as any)?.username || "User"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {profile?.tier && (
                            <Badge className={`text-xs ${getTierColor(profile.tier)}`}>
                              <Crown className="w-3 h-3 mr-1" />
                              {getTierDisplayName(profile.tier)}
                            </Badge>
                          )}
                          {profile?.coins !== undefined && (
                            <div className="flex items-center space-x-1 text-xs bg-yellow-100 dark:bg-yellow-900/20 px-2 py-0.5 rounded-full">
                              <Coins className="h-3 w-3 text-yellow-600" />
                              <span className="font-medium text-yellow-700 dark:text-yellow-400">
                                {profile.coins.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Items */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-1">
                      {getMobileNavItems().map((item: any) => {
                        const isActive =
                          pathname === item.href || (item.href === "/dashboard" && pathname?.startsWith("/dashboard"))

                        return (
                          <Button
                            key={item.name}
                            asChild
                            variant={isActive ? "default" : "ghost"}
                            className={cn(
                              "w-full justify-start h-11 transition-all duration-200",
                              isActive ? "bg-lime-500 text-teal-900 hover:bg-lime-600 shadow-sm" : "hover:bg-accent/50",
                            )}
                            onClick={() => setIsOpen(false)}
                          >
                            <Link href={item.href} className="flex items-center space-x-3">
                              <item.icon className="h-5 w-5 flex-shrink-0" />
                              <span className="font-medium">{item.name}</span>
                            </Link>
                          </Button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Auth Buttons for Mobile */}
                  <div className="p-4 border-t">
                    {user ? (
                      <div className="space-y-2">
                        <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                          <Link href="/profile" onClick={() => setIsOpen(false)}>
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-red-600 hover:text-red-600 bg-transparent border-red-200 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => {
                            handleSignOut()
                            setIsOpen(false)
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          asChild
                          variant="outline"
                          className="w-full bg-transparent"
                          onClick={() => setIsOpen(false)}
                        >
                          <Link href="/login">Sign In</Link>
                        </Button>
                        <Button
                          asChild
                          className="w-full bg-lime-500 text-teal-900 hover:bg-lime-600"
                          onClick={() => setIsOpen(false)}
                        >
                          <Link href="/signup">Join Now</Link>
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Theme Toggle Section for Mobile */}
                  <div className="p-4 border-t bg-muted/20">
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-3 text-muted-foreground">Theme</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={theme === "light" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTheme("light")}
                          className="flex flex-col items-center py-3 h-auto text-xs"
                        >
                          <Sun className="h-4 w-4 mb-1" />
                          Light
                        </Button>
                        <Button
                          variant={theme === "dark" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTheme("dark")}
                          className="flex flex-col items-center py-3 h-auto text-xs"
                        >
                          <Moon className="h-4 w-4 mb-1" />
                          Dark
                        </Button>
                        <Button
                          variant={theme === "system" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTheme("system")}
                          className="flex flex-col items-center py-3 h-auto text-xs"
                        >
                          <Monitor className="h-4 w-4 mb-1" />
                          Auto
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
