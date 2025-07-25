"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DynamicLogo } from "@/components/dynamic-logo"
import { useAuth } from "@/contexts/auth-context"
import { CoinBalance } from "@/components/coin-balance"
import {
  Menu,
  Home,
  Users,
  ShoppingBag,
  Radio,
  Archive,
  User,
  Settings,
  LogOut,
  Coins,
  Video,
  LayoutDashboard,
  Crown,
  Ticket,
} from "lucide-react"

const navigationItems = [
  { name: "Home", href: "/", icon: Home, public: true },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, protected: true },
  { name: "Community", href: "/community", icon: Users, protected: true },
  { name: "Vault", href: "/vault", icon: Archive, protected: true },
  { name: "Store", href: "/merch", icon: ShoppingBag, protected: true },
  { name: "Radio", href: "/radio", icon: Radio, protected: true },
  { name: "Meet & Greet", href: "/meet-greet", icon: Video, protected: true },
  { name: "Premium", href: "/premium", icon: Crown, protected: true },
  { name: "Tickets", href: "/tickets", icon: Ticket, protected: true },
]

export function MainNavigation() {
  const { user, session, loading, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleProtectedNavigation = (href: string) => {
    if (!user) {
      // Store the intended destination
      localStorage.setItem("redirectAfterAuth", href)
      router.push("/login")
      return
    }
    router.push(href)
    setIsOpen(false)
  }

  if (!mounted) {
    return (
      <nav className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="h-12 w-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </nav>
    )
  }

  const visibleItems = navigationItems.filter((item) => item.public || (item.protected && user))

  return (
    <nav className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <div className="mr-8">
          <Link href="/" className="flex items-center space-x-2">
            <DynamicLogo className="h-12 md:h-14 lg:h-16 w-auto" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-between">
          <div className="flex items-center space-x-6">
            {visibleItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
              return (
                <Button
                  key={item.name}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="text-sm font-medium"
                  onClick={() => {
                    if (item.protected && !user) {
                      handleProtectedNavigation(item.href)
                    } else {
                      router.push(item.href)
                    }
                  }}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              )
            })}
          </div>

          {/* Desktop User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <CoinBalance />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.user_metadata?.avatar_url || "/placeholder.svg"}
                          alt={user.email || ""}
                        />
                        <AvatarFallback>{user.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.user_metadata?.full_name || user.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/coins")}>
                      <Coins className="mr-2 h-4 w-4" />
                      Coins
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
                  Sign In
                </Button>
                <Button size="sm" onClick={() => router.push("/signup")}>
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex flex-1 items-center justify-end md:hidden">
          {user && <CoinBalance />}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4">
                {/* Mobile Logo */}
                <div className="flex items-center justify-center pb-4 border-b">
                  <DynamicLogo className="h-10 w-auto" />
                </div>

                {/* User Info */}
                {user ? (
                  <div className="flex items-center space-x-4 pb-4 border-b">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} alt={user.email || ""} />
                      <AvatarFallback>{user.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.user_metadata?.full_name || user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2 pb-4 border-b">
                    <Button
                      onClick={() => {
                        router.push("/login")
                        setIsOpen(false)
                      }}
                    >
                      Sign In
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        router.push("/signup")
                        setIsOpen(false)
                      }}
                    >
                      Sign Up
                    </Button>
                  </div>
                )}

                {/* Navigation Items */}
                <div className="flex flex-col space-y-2">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
                    return (
                      <Button
                        key={item.name}
                        variant={isActive ? "default" : "ghost"}
                        className="justify-start"
                        onClick={() => {
                          if (item.protected && !user) {
                            handleProtectedNavigation(item.href)
                          } else {
                            router.push(item.href)
                            setIsOpen(false)
                          }
                        }}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Button>
                    )
                  })}
                </div>

                {/* User Actions */}
                {user && (
                  <>
                    <div className="border-t pt-4">
                      <div className="flex flex-col space-y-2">
                        <Button
                          variant="ghost"
                          className="justify-start"
                          onClick={() => {
                            router.push("/profile")
                            setIsOpen(false)
                          }}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start"
                          onClick={() => {
                            router.push("/coins")
                            setIsOpen(false)
                          }}
                        >
                          <Coins className="mr-2 h-4 w-4" />
                          Coins
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start"
                          onClick={() => {
                            router.push("/settings")
                            setIsOpen(false)
                          }}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            handleSignOut()
                            setIsOpen(false)
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign out
                        </Button>
                      </div>
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
