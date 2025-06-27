"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Menu,
  Home,
  Users,
  Music,
  ShoppingBag,
  Ticket,
  Vault,
  Coins,
  User,
  Settings,
  LogOut,
  Crown,
  Star,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { DynamicLogo } from "@/components/dynamic-logo"
import { UserTierBadge } from "@/components/user-tier-badge"
import { SimpleNotificationBell } from "@/components/community/simple-notification-bell"

const navigationItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Community", href: "/community", icon: Users },
  { name: "Chronicles", href: "/chronicles", icon: Music },
  { name: "Merch", href: "/merch", icon: ShoppingBag },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Vault", href: "/vault", icon: Vault },
  { name: "Coins", href: "/coins", icon: Coins },
]

export function UnifiedNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signOut, userProfile } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const getUserInitials = (email: string) => {
    return email.split("@")[0].slice(0, 2).toUpperCase()
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "ELDER":
      case "BLOOD":
        return <Crown className="h-3 w-3" />
      case "PIONEER":
        return <Star className="h-3 w-3" />
      default:
        return null
    }
  }

  const isAuthPage =
    pathname?.startsWith("/login") || pathname?.startsWith("/signup") || pathname?.startsWith("/forgot-password")

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Always goes to home */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <DynamicLogo className="h-8 w-8" />
            <span className="font-bold text-xl bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Erigga Live
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`flex items-center space-x-2 ${
                      isActive
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "hover:bg-orange-50 hover:text-orange-600"
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
            {user ? (
              <>
                {/* Notifications */}
                <SimpleNotificationBell />

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={userProfile?.avatar_url || ""} alt={user.email || ""} />
                        <AvatarFallback className="bg-orange-500 text-white">
                          {getUserInitials(user.email || "")}
                        </AvatarFallback>
                      </Avatar>
                      {userProfile?.tier && ["ELDER", "BLOOD", "PIONEER"].includes(userProfile.tier) && (
                        <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                          {getTierIcon(userProfile.tier)}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.email}</p>
                        {userProfile && (
                          <div className="flex items-center gap-2">
                            <UserTierBadge tier={userProfile.tier} />
                            <Badge variant="outline" className="text-xs">
                              {userProfile.erigga_coins || 0} coins
                            </Badge>
                          </div>
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
                      <Link href="/settings" className="flex items-center">
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
              </>
            ) : (
              !isAuthPage && (
                <div className="hidden md:flex items-center space-x-2">
                  <Link href="/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">Join Now</Button>
                  </Link>
                </div>
              )
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  {/* User Info (Mobile) */}
                  {user && (
                    <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={userProfile?.avatar_url || ""} alt={user.email || ""} />
                        <AvatarFallback className="bg-orange-500 text-white">
                          {getUserInitials(user.email || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="font-medium text-sm">{user.email}</p>
                        {userProfile && (
                          <div className="flex items-center gap-2 mt-1">
                            <UserTierBadge tier={userProfile.tier} />
                            <Badge variant="outline" className="text-xs">
                              {userProfile.erigga_coins || 0} coins
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Navigation Items */}
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive ? "bg-orange-500 text-white" : "hover:bg-orange-50 hover:text-orange-600"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    )
                  })}

                  {/* Auth Buttons (Mobile) */}
                  {user ? (
                    <div className="pt-4 border-t space-y-2">
                      <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          <User className="mr-2 h-4 w-4" />
                          Dashboard
                        </Button>
                      </Link>
                      <Link href="/settings" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setIsOpen(false)
                          handleSignOut()
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    !isAuthPage && (
                      <div className="pt-4 border-t space-y-2">
                        <Link href="/login" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" className="w-full">
                            Sign In
                          </Button>
                        </Link>
                        <Link href="/signup" onClick={() => setIsOpen(false)}>
                          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">Join Now</Button>
                        </Link>
                      </div>
                    )
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
