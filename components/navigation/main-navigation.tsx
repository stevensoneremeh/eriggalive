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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Home,
  Users,
  Archive,
  Video,
  Radio,
  ShoppingBag,
  Ticket,
  Crown,
  Coins,
  Menu,
  User,
  Settings,
  LogOut,
  Shield,
  Moon,
  Sun,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import Image from "next/image"

const navigationItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Community", href: "/community", icon: Users },
  { name: "Vault", href: "/vault", icon: Archive },
  { name: "Meet & Greet", href: "/meet-greet", icon: Video },
  { name: "Radio", href: "/radio", icon: Radio },
  { name: "Merch", href: "/merch", icon: ShoppingBag },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Premium", href: "/premium", icon: Crown },
  { name: "Coins", href: "/coins", icon: Coins },
]

export function MainNavigation() {
  const pathname = usePathname()
  const { profile, isAuthenticated, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood_brotherhood":
      case "blood":
        return "bg-red-500"
      case "elder":
        return "bg-purple-500"
      case "pioneer":
        return "bg-blue-500"
      case "grassroot":
        return "bg-green-500"
      default:
        return "bg-gray-500"
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

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  if (!mounted) {
    return null
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative w-10 h-10">
              <Image
                src="/images/loggotrans-light.png"
                alt="Erigga"
                fill
                className="object-contain dark:hidden"
                priority
              />
              <Image
                src="/images/loggotrans-dark.png"
                alt="Erigga"
                fill
                className="object-contain hidden dark:block"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                ERIGGA
              </h1>
              <p className="text-xs text-muted-foreground -mt-1">LIVE</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "flex items-center space-x-2 transition-all duration-200",
                      isActive && "bg-primary text-primary-foreground shadow-md",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden xl:inline">{item.name}</span>
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Theme Toggle */}
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="hidden md:flex">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* User Menu */}
            {isAuthenticated && profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} alt={profile.username} />
                      <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge className={cn("text-xs", getTierColor(profile.tier || "grassroot"), "text-white")}>
                          {getTierDisplayName(profile.tier || "grassroot")}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Coins className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs font-medium">{profile.coins_balance || 0}</span>
                        </div>
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
                    <Link href="/profile/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  {profile.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-4">
                  {/* Mobile Logo */}
                  <div className="flex items-center space-x-3 pb-4 border-b">
                    <div className="relative w-8 h-8">
                      <Image
                        src="/images/loggotrans-light.png"
                        alt="Erigga"
                        fill
                        className="object-contain dark:hidden"
                      />
                      <Image
                        src="/images/loggotrans-dark.png"
                        alt="Erigga"
                        fill
                        className="object-contain hidden dark:block"
                      />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold">ERIGGA</h1>
                      <p className="text-xs text-muted-foreground -mt-1">LIVE</p>
                    </div>
                  </div>

                  {/* Mobile Theme Toggle */}
                  <Button variant="ghost" onClick={toggleTheme} className="justify-start">
                    {theme === "dark" ? (
                      <>
                        <Sun className="mr-2 h-4 w-4" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="mr-2 h-4 w-4" />
                        Dark Mode
                      </>
                    )}
                  </Button>

                  {/* Mobile Navigation Items */}
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link key={item.name} href={item.href}>
                        <Button variant={isActive ? "default" : "ghost"} className="w-full justify-start">
                          <Icon className="mr-2 h-4 w-4" />
                          {item.name}
                        </Button>
                      </Link>
                    )
                  })}

                  {/* Mobile Auth */}
                  {isAuthenticated && profile ? (
                    <div className="pt-4 border-t">
                      <div className="flex items-center space-x-3 mb-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} alt={profile.username} />
                          <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{profile.username}</p>
                          <div className="flex items-center justify-between">
                            <Badge className={cn("text-xs", getTierColor(profile.tier || "grassroot"), "text-white")}>
                              {getTierDisplayName(profile.tier || "grassroot")}
                            </Badge>
                            <div className="flex items-center space-x-1">
                              <Coins className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs">{profile.coins_balance || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Button variant="ghost" className="w-full justify-start" asChild>
                          <Link href="/dashboard">
                            <User className="mr-2 h-4 w-4" />
                            Dashboard
                          </Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                          <Link href="/profile/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </Link>
                        </Button>
                        {profile.role === "admin" && (
                          <Button variant="ghost" className="w-full justify-start" asChild>
                            <Link href="/admin">
                              <Shield className="mr-2 h-4 w-4" />
                              Admin Panel
                            </Link>
                          </Button>
                        )}
                        <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Log out
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 border-t space-y-2">
                      <Button variant="ghost" className="w-full" asChild>
                        <Link href="/login">Sign In</Link>
                      </Button>
                      <Button className="w-full" asChild>
                        <Link href="/signup">Sign Up</Link>
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
