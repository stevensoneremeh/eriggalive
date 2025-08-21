"use client"
import { useState } from "react"
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
  Users,
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
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { DynamicLogo } from "@/components/dynamic-logo"
import { Badge } from "@/components/ui/badge"

const navigationItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Mission", href: "/mission", icon: Target },
  { name: "Community", href: "/community", icon: Users },
  { name: "Vault", href: "/vault", icon: Music },
  { name: "Coins", href: "/coins", icon: Coins },
  { name: "Chat", href: "/chat", icon: MessageCircle },
  { name: "Meet & Greet", href: "/meet-and-greet", icon: Phone },
  { name: "Merch", href: "/merch", icon: ShoppingBag },
  { name: "Chronicles", href: "/chronicles", icon: Calendar },
  { name: "Radio", href: "/rooms/freebies", icon: Radio },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "About", href: "/about", icon: Info },
]

export function UnifiedNavigation() {
  const { user, profile, signOut } = useAuth()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "grassroot":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pioneer":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "elder":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "blood_brotherhood":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <DynamicLogo responsive={true} className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.slice(0, 6).map((item) => {
              const isActive = pathname === item.href
              return (
                <Button
                  key={item.name}
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={isActive ? "bg-lime-500 text-teal-900 hover:bg-lime-600" : ""}
                >
                  <Link href={item.href} className="flex items-center space-x-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                </Button>
              )
            })}
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Coins Display */}
                {profile?.coins !== undefined && (
                  <div className="hidden sm:flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
                    <Coins className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                      {profile.coins.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={profile?.avatar_url || "/placeholder-user.jpg"}
                          alt={profile?.username || "User"}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold">
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
                            {profile.tier.replace("_", " ").toUpperCase()}
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
              <div className="hidden md:flex items-center space-x-2">
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
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-4">
                  {/* User Info in Mobile */}
                  {user && (
                    <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={profile?.avatar_url || "/placeholder-user.jpg"}
                          alt={profile?.username || "User"}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold">
                          {profile?.full_name?.charAt(0) ||
                            profile?.username?.charAt(0) ||
                            user?.email?.charAt(0) ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="font-medium">{profile?.full_name || profile?.username || "User"}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        {profile?.tier && (
                          <Badge className={`w-fit text-xs mt-1 ${getTierColor(profile.tier)}`}>
                            <Crown className="w-3 h-3 mr-1" />
                            {profile.tier.replace("_", " ").toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Navigation Items */}
                  <div className="space-y-2">
                    {navigationItems.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Button
                          key={item.name}
                          asChild
                          variant={isActive ? "default" : "ghost"}
                          className={`w-full justify-start ${
                            isActive ? "bg-lime-500 text-teal-900 hover:bg-lime-600" : ""
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          <Link href={item.href} className="flex items-center space-x-2">
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </Link>
                        </Button>
                      )
                    })}
                  </div>

                  {/* Auth Buttons for Mobile */}
                  {user ? (
                    <div className="space-y-2 pt-4 border-t">
                      <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                        <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                          <User className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                        <Link href="/profile" onClick={() => setIsOpen(false)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-red-600 hover:text-red-600 bg-transparent"
                        onClick={() => {
                          handleSignOut()
                          setIsOpen(false)
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-4 border-t">
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
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
