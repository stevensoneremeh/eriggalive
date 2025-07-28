"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "next-themes"
import { CoinBalance } from "@/components/coin-balance"
import { UserTierBadge } from "@/components/user-tier-badge"
import { DynamicLogo } from "@/components/dynamic-logo"
import {
  Home,
  Users,
  BookOpen,
  Vault,
  Ticket,
  Crown,
  ShoppingBag,
  Coins,
  User,
  LogOut,
  Menu,
  Sun,
  Moon,
  Search,
  Target,
  X,
} from "lucide-react"

const navigationItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Mission", href: "/mission", icon: Target },
  { name: "Community", href: "/community", icon: Users },
  { name: "Chronicles", href: "/chronicles", icon: BookOpen },
  { name: "Vault", href: "/vault", icon: Vault },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Premium", href: "/premium", icon: Crown },
  { name: "Merch", href: "/merch", icon: ShoppingBag },
  { name: "Coins", href: "/coins", icon: Coins },
]

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()
  const { user, profile, signOut, isAuthenticated } = useAuth()
  const { theme, setTheme } = useTheme()

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsOpen(false)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <DynamicLogo className="h-8 w-auto" />
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* User Avatar or Menu */}
            {isAuthenticated && profile ? (
              <div className="flex items-center gap-2">
                <CoinBalance coins={profile.coins_balance || 0} />
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm">
                          {profile.username?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <MobileMenu
                      profile={profile}
                      navigationItems={navigationItems}
                      pathname={pathname}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      handleSignOut={handleSignOut}
                      setIsOpen={setIsOpen}
                    />
                  </SheetContent>
                </Sheet>
              </div>
            ) : (
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <MobileMenu
                    profile={null}
                    navigationItems={navigationItems}
                    pathname={pathname}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleSignOut={handleSignOut}
                    setIsOpen={setIsOpen}
                  />
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navigationItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}

interface MobileMenuProps {
  profile: any
  navigationItems: any[]
  pathname: string
  searchQuery: string
  setSearchQuery: (query: string) => void
  handleSignOut: () => void
  setIsOpen: (open: boolean) => void
}

function MobileMenu({
  profile,
  navigationItems,
  pathname,
  searchQuery,
  setSearchQuery,
  handleSignOut,
  setIsOpen,
}: MobileMenuProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <DynamicLogo className="h-6 w-auto" />
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* User Profile Section */}
      {profile && (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg mb-6">
          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
            <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              {profile.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{profile.full_name || profile.username}</p>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            <div className="flex items-center gap-2 mt-1">
              <UserTierBadge tier={profile.subscription_tier || "general"} size="sm" />
              <CoinBalance coins={profile.coins_balance || 0} />
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Auth Actions */}
      <div className="border-t pt-4 space-y-2">
        {profile ? (
          <>
            <Link
              href={`/profile/${profile.username}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <User className="h-5 w-5" />
              <span>Profile</span>
            </Link>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start gap-3 px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </Button>
          </>
        ) : (
          <div className="space-y-2">
            <Link href="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full bg-transparent">
                Sign In
              </Button>
            </Link>
            <Link href="/signup" onClick={() => setIsOpen(false)}>
              <Button className="w-full">Sign Up</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
