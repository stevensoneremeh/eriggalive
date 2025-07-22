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
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import {
  Home,
  Users,
  MessageCircle,
  Coins,
  Radio,
  Gift,
  Crown,
  Settings,
  LogOut,
  Menu,
  User,
  Star,
  Zap,
  Heart,
  Shield,
} from "lucide-react"

const navigationItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Community", href: "/community", icon: Users },
  { name: "Chat", href: "/chat", icon: MessageCircle },
  { name: "Coins", href: "/coins", icon: Coins },
  { name: "Radio", href: "/radio", icon: Radio },
  { name: "Freebies", href: "/rooms/freebies", icon: Gift },
  { name: "Premium", href: "/premium", icon: Crown },
]

const getTierIcon = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case "blood_brotherhood":
    case "blood":
      return Heart
    case "elder":
      return Crown
    case "pioneer":
      return Zap
    case "grassroot":
      return Star
    default:
      return Shield
  }
}

const getTierColor = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case "blood_brotherhood":
    case "blood":
      return "text-red-500 bg-red-50 border-red-200"
    case "elder":
      return "text-purple-500 bg-purple-50 border-purple-200"
    case "pioneer":
      return "text-blue-500 bg-blue-50 border-blue-200"
    case "grassroot":
      return "text-green-500 bg-green-50 border-green-200"
    default:
      return "text-gray-500 bg-gray-50 border-gray-200"
  }
}

export function Navigation() {
  const { user, profile, loading, signOut } = useAuth()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navigationItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => mobile && setIsOpen(false)}
            className={cn(
              "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              mobile ? "w-full" : "",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.name}</span>
          </Link>
        )
      })}
    </>
  )

  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full animate-pulse" />
                <span className="font-bold text-xl">Erigga Live</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
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
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Erigga Live
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavItems />
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user && profile ? (
              <>
                {/* Coins Display */}
                <div className="hidden sm:flex items-center space-x-2 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
                  <Coins className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                    {profile.coins_balance || 0}
                  </span>
                </div>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.username} />
                        <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium leading-none">{profile.full_name || profile.username}</p>
                          {(() => {
                            const TierIcon = getTierIcon(profile.tier)
                            return <TierIcon className="h-3 w-3 text-muted-foreground" />
                          })()}
                        </div>
                        <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                        <Badge variant="outline" className={cn("w-fit text-xs", getTierColor(profile.tier))}>
                          {profile.tier?.charAt(0).toUpperCase() + profile.tier?.slice(1)}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
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
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
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
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-4">
                  <NavItems mobile />
                  {user && profile && (
                    <>
                      <div className="border-t pt-4">
                        <div className="flex items-center space-x-3 mb-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.username} />
                            <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{profile.full_name || profile.username}</p>
                            <Badge variant="outline" className={cn("text-xs", getTierColor(profile.tier))}>
                              {profile.tier?.charAt(0).toUpperCase() + profile.tier?.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mb-4 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg">
                          <Coins className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                            {profile.coins_balance || 0} Coins
                          </span>
                        </div>
                        <div className="space-y-2">
                          <Link
                            href="/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm hover:bg-accent"
                          >
                            <User className="h-4 w-4" />
                            <span>Profile</span>
                          </Link>
                          <Link
                            href="/settings"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm hover:bg-accent"
                          >
                            <Settings className="h-4 w-4" />
                            <span>Settings</span>
                          </Link>
                          <Button
                            variant="ghost"
                            onClick={handleSignOut}
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
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
      </div>
    </nav>
  )
}
