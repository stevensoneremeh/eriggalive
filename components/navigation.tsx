"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { DynamicLogo } from "@/components/dynamic-logo"
import { Menu, Home, Users, BookOpen, Vault, Ticket, Crown, ShoppingBag, Coins, Settings, LogOut } from "lucide-react"

const navigationItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Community", href: "/community", icon: Users },
  { name: "Chronicles", href: "/chronicles", icon: BookOpen },
  { name: "Vault", href: "/vault", icon: Vault },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Premium", href: "/premium", icon: Crown },
  { name: "Merch", href: "/merch", icon: ShoppingBag },
  { name: "Coins", href: "/coins", icon: Coins },
]

const getTierColor = (tier: string) => {
  switch (tier) {
    case "admin":
      return "bg-red-500"
    case "blood_brotherhood":
      return "bg-red-600"
    case "elder":
      return "bg-purple-500"
    case "pioneer":
      return "bg-blue-500"
    case "grassroot":
    default:
      return "bg-green-500"
  }
}

const getTierLabel = (tier: string) => {
  switch (tier) {
    case "admin":
      return "Admin"
    case "blood_brotherhood":
      return "Blood Brotherhood"
    case "elder":
      return "Elder"
    case "pioneer":
      return "Pioneer"
    case "grassroot":
    default:
      return "Grassroot"
  }
}

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push("/")
    setIsOpen(false)
  }

  const handleNavigation = (href: string) => {
    router.push(href)
    setIsOpen(false)
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <DynamicLogo className="h-8 w-8" />
            <span className="font-bold text-xl bg-gradient-to-r from-lime-600 to-teal-600 bg-clip-text text-transparent">
              Erigga Live
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigationItems.slice(0, 4).map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="hidden md:flex items-center space-x-4">
                {/* Coins Display */}
                <div className="flex items-center space-x-1 text-sm">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{user.coins?.toLocaleString() || 0}</span>
                </div>

                {/* User Avatar and Info */}
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={user.username} />
                    <AvatarFallback>
                      {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.username || user.email}</span>
                    <Badge variant="secondary" className={`text-xs ${getTierColor(user.tier)} text-white`}>
                      {getTierLabel(user.tier)}
                    </Badge>
                  </div>
                </div>

                {/* Logout Button */}
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
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
                <div className="flex flex-col h-full">
                  {/* User Info */}
                  {isAuthenticated && user ? (
                    <div className="flex items-center space-x-3 p-4 border-b">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={user.username} />
                        <AvatarFallback>
                          {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.username || user.email}</span>
                        <Badge variant="secondary" className={`text-xs w-fit ${getTierColor(user.tier)} text-white`}>
                          {getTierLabel(user.tier)}
                        </Badge>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Coins className="h-3 w-3 text-yellow-500" />
                          <span>{user.coins?.toLocaleString() || 0} coins</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-b">
                      <div className="space-y-2">
                        <Button className="w-full" onClick={() => handleNavigation("/login")}>
                          Sign In
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => handleNavigation("/signup")}>
                          Sign Up
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Navigation Items */}
                  <div className="flex-1 py-4">
                    <div className="space-y-1">
                      {navigationItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                          <button
                            key={item.name}
                            onClick={() => handleNavigation(item.href)}
                            className={`flex items-center space-x-3 w-full px-4 py-3 text-left rounded-md transition-colors ${
                              isActive
                                ? "bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                          >
                            <item.icon className="h-5 w-5" />
                            <span>{item.name}</span>
                          </button>
                        )
                      })}

                      {isAuthenticated && (
                        <>
                          <button
                            onClick={() => handleNavigation("/settings")}
                            className="flex items-center space-x-3 w-full px-4 py-3 text-left rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            <Settings className="h-5 w-5" />
                            <span>Settings</span>
                          </button>
                          <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 w-full px-4 py-3 text-left rounded-md transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <LogOut className="h-5 w-5" />
                            <span>Sign Out</span>
                          </button>
                        </>
                      )}
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
