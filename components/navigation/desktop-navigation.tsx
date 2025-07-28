"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "next-themes"
import { CoinBalance } from "@/components/coin-balance"
import { UserTierBadge } from "@/components/user-tier-badge"
import { DynamicLogo } from "@/components/dynamic-logo"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { MessageCenter } from "@/components/messaging/message-center"
import {
  User,
  Settings,
  LogOut,
  Crown,
  ChevronDown,
  Sun,
  Moon,
  Trophy,
  Bookmark,
  Heart,
  TrendingUp,
  Target,
  Home,
  Users,
  BookOpen,
  Vault,
  Ticket,
  ShoppingBag,
  Coins,
  Search,
} from "lucide-react"
import { useState } from "react"

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

export function DesktopNavigation() {
  const pathname = usePathname()
  const { user, profile, signOut, isAuthenticated } = useAuth()
  const { theme, setTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")

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

  return (
    <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <DynamicLogo className="h-10 w-auto" />
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden xl:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 rounded-lg border bg-background/50 py-2 pl-10 pr-4 text-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {isAuthenticated && profile ? (
              <>
                {/* Coin Balance */}
                <CoinBalance coins={profile.coins_balance || 0} />

                {/* Notifications */}
                <NotificationCenter />

                {/* Messages */}
                <MessageCenter />

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-2 h-10">
                      <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                        <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm">
                          {profile.username?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden xl:flex flex-col items-start">
                        <span className="text-sm font-medium truncate max-w-24">
                          {profile.full_name || profile.username}
                        </span>
                        <UserTierBadge tier={profile.subscription_tier || "general"} size="sm" />
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                            <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium leading-none">{profile.full_name || profile.username}</p>
                            <p className="text-xs leading-none text-muted-foreground">@{profile.username}</p>
                          </div>
                          <UserTierBadge tier={profile.subscription_tier || "general"} size="sm" />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <Coins className="h-3 w-3 text-yellow-500" />
                            <span>{profile.coins_balance || 0} coins</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Trophy className="h-3 w-3 text-blue-500" />
                            <span>{profile.total_votes_received || 0} votes</span>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${profile.username}`} className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/premium" className="flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        Premium
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/bookmarks" className="flex items-center gap-2">
                        <Bookmark className="h-4 w-4" />
                        Bookmarks
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/liked" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Liked Posts
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/analytics" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Analytics
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-red-600">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
