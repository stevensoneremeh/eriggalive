"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DynamicLogo } from "@/components/dynamic-logo"
import { CoinBalance } from "@/components/coin-balance"
import { UserTierBadge } from "@/components/user-tier-badge"
import {
  Menu,
  Home,
  Users,
  Vault,
  Radio,
  ShoppingBag,
  Calendar,
  User,
  Settings,
  LogOut,
  Coins,
  MessageCircle,
  Crown,
  Ticket,
  BookOpen,
} from "lucide-react"

const navigationItems = [
  { name: "Home", href: "/", icon: Home, public: true },
  { name: "Dashboard", href: "/dashboard", icon: Home, protected: true },
  { name: "Community", href: "/community", icon: Users, protected: true },
  { name: "Vault", href: "/vault", icon: Vault, protected: true },
  { name: "Radio", href: "/radio", icon: Radio, protected: true },
  { name: "Meet & Greet", href: "/meet-greet", icon: Calendar, protected: true },
  { name: "Merch", href: "/merch", icon: ShoppingBag, protected: true },
  { name: "Coins", href: "/coins", icon: Coins, protected: true },
  { name: "Chat", href: "/chat", icon: MessageCircle, protected: true },
  { name: "Premium", href: "/premium", icon: Crown, protected: true },
  { name: "Tickets", href: "/tickets", icon: Ticket, protected: true },
  { name: "Chronicles", href: "/chronicles", icon: BookOpen, protected: true },
]

export function MainNavigation() {
  const { user, profile, signOut, loading } = useAuth()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  const filteredNavItems = navigationItems.filter((item) => {
    if (item.public) return true
    if (item.protected && user) return true
    return false
  })

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {filteredNavItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            } ${mobile ? "w-full" : ""}`}
            onClick={() => mobile && setIsOpen(false)}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <DynamicLogo className="h-8 w-8" />
          <span className="font-bold text-xl">Erigga Live</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          <NavItems />
        </nav>

        {/* User Section */}
        <div className="flex items-center space-x-4">
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : user && profile ? (
            <>
              {/* Coin Balance */}
              <CoinBalance balance={profile.coins_balance} />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.username} />
                      <AvatarFallback>{profile.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                      <UserTierBadge tier={profile.tier} />
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
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
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
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
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-4">
                <NavItems mobile />

                {user && profile && (
                  <>
                    <div className="border-t pt-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.username} />
                          <AvatarFallback>{profile.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{profile.username}</p>
                          <UserTierBadge tier={profile.tier} />
                        </div>
                      </div>
                      <CoinBalance balance={profile.coins_balance} />
                    </div>

                    <Button variant="ghost" onClick={handleSignOut} className="justify-start">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </Button>
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
