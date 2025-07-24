"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Home,
  Users,
  MessageSquare,
  Radio,
  Archive,
  Coins,
  ShoppingBag,
  Ticket,
  Crown,
  Menu,
  LogOut,
  Settings,
  User,
  Bell,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { UserTierBadge } from "@/components/user-tier-badge"
import { cn } from "@/lib/utils"

const navigationItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Community", href: "/community", icon: Users },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Radio", href: "/radio", icon: Radio },
  { name: "Media Vault", href: "/vault", icon: Archive }, // Using Archive instead of Vault
  { name: "Erigga Coins", href: "/coins", icon: Coins },
  { name: "Merch Store", href: "/merch", icon: ShoppingBag },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Premium", href: "/premium", icon: Crown },
]

export function FixedNavigation() {
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">E</span>
          </div>
          <span className="font-bold text-xl">Erigga Live</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn("flex items-center gap-2", isActive && "bg-primary text-primary-foreground")}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  3
                </Badge>
              </Button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback>{profile?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium">{profile?.full_name || profile?.username}</p>
                      {profile?.tier && <UserTierBadge tier={profile.tier} size="xs" />}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${profile?.username}`} className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
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
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col gap-4 mt-8">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
                      <Button variant={isActive ? "default" : "ghost"} className="w-full justify-start gap-2">
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </Button>
                    </Link>
                  )
                })}

                {user && (
                  <>
                    <div className="border-t pt-4 mt-4">
                      <Link href={`/profile/${profile?.username}`} onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <User className="h-4 w-4" />
                          Profile
                        </Button>
                      </Link>
                      <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <Settings className="h-4 w-4" />
                          Dashboard
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-red-600"
                        onClick={() => {
                          handleSignOut()
                          setIsOpen(false)
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
