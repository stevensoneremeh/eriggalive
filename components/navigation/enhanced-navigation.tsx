"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Users,
  BookOpen,
  Vault,
  Ticket,
  Crown,
  ShoppingBag,
  Coins,
  Menu,
  Search,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  Trophy,
  Bookmark,
  Heart,
  TrendingUp,
  LayoutDashboard,
} from "lucide-react"

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

import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { MessageCenter } from "@/components/messaging/message-center"
import { CoinBalance } from "@/components/coin-balance"
import { UserTierBadge } from "@/components/user-tier-badge"
import { cn } from "@/lib/utils"

const NAVIGATION_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }, // Add dashboard
  { href: "/community", label: "Community", icon: Users },
  { href: "/chronicles", label: "Chronicles", icon: BookOpen },
  { href: "/vault", label: "Vault", icon: Vault },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/premium", label: "Premium", icon: Crown },
  { href: "/merch", label: "Merch", icon: ShoppingBag },
  { href: "/coins", label: "Coins", icon: Coins },
]

export function EnhancedNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error("signOut error:", err)
    }
  }

  /* ------------------------------ RENDER ------------------------------ */
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
              <span className="text-sm font-bold text-white">E</span>
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent">
              EriggaLive
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center space-x-1 md:flex">
            {NAVIGATION_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href))
              return (
                <Link key={href} href={href}>
                  <Button
                    variant={active ? "default" : "ghost"}
                    className={cn(
                      "flex items-center gap-2 transition-all",
                      active && "bg-primary text-primary-foreground shadow-md",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{label}</span>
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Right-side actions */}
          <div className="flex items-center space-x-2">
            {/* Search on ≥sm screens */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 rounded-lg border bg-background/50 py-2 pl-10 pr-4 text-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {user ? (
              <>
                {/* Authenticated controls */}
                <CoinBalance />
                <NotificationCenter />
                <MessageCenter />

                {/* Theme toggle desktop */}
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="hidden sm:flex">
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>

                {/* User dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 ring-2 ring-primary/20 transition-all hover:ring-primary/40">
                        <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} alt={profile?.username} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 font-bold text-white">
                          {profile?.username?.charAt(0).toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      {profile?.tier && (
                        <div className="absolute -bottom-1 -right-1">
                          <UserTierBadge tier={profile.tier} size="xs" />
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} alt={profile?.username} />
                            <AvatarFallback>{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                            <p className="text-xs leading-none text-muted-foreground">@{profile?.username}</p>
                          </div>
                          {profile?.tier && <UserTierBadge tier={profile.tier} size="sm" />}
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <Coins className="h-3 w-3 text-yellow-500" />
                            <span>{profile?.coins ?? 0} coins</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Trophy className="h-3 w-3 text-blue-500" />
                            <span>{profile?.points ?? 0} points</span>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${profile?.username}`} className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/achievements" className="flex items-center">
                        <Trophy className="mr-2 h-4 w-4" />
                        <span>Achievements</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/bookmarks" className="flex items-center">
                        <Bookmark className="mr-2 h-4 w-4" />
                        <span>Bookmarks</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/liked" className="flex items-center">
                        <Heart className="mr-2 h-4 w-4" />
                        <span>Liked Posts</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/analytics" className="flex items-center">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        <span>Analytics</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>

                    {/* Theme toggle mobile */}
                    <DropdownMenuItem onClick={toggleTheme} className="sm:hidden">
                      {theme === "dark" ? (
                        <>
                          <Sun className="mr-2 h-4 w-4" />
                          <span>Light Mode</span>
                        </>
                      ) : (
                        <>
                          <Moon className="mr-2 h-4 w-4" />
                          <span>Dark Mode</span>
                        </>
                      )}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              // Un-authenticated
              <>
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
                <Link href="/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}

            {/* Mobile menu trigger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                {/* Mobile search */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Mobile nav links */}
                <nav className="flex flex-col space-y-2">
                  {NAVIGATION_ITEMS.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || (href !== "/" && pathname.startsWith(href))
                    return (
                      <Link key={href} href={href} onClick={() => setIsOpen(false)}>
                        <Button
                          variant={active ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start gap-2",
                            active && "bg-primary text-primary-foreground shadow-md",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </Button>
                      </Link>
                    )
                  })}
                </nav>

                {/* Auth / sign out buttons on mobile sheet bottom */}
                <div className="mt-8 border-t pt-4">
                  {user ? (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        handleSignOut()
                        setIsOpen(false)
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="mb-2 w-full">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/signup" onClick={() => setIsOpen(false)}>
                        <Button className="w-full">Sign Up</Button>
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  )
}
