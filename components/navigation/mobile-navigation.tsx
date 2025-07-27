"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { CoinBalance } from "@/components/coin-balance"
import { UserTierBadge } from "@/components/user-tier-badge"
import { Home, Users, Radio, Vault, Coins, Calendar, ShoppingBag, User, LogOut, Menu, Crown } from "lucide-react"

const navigationItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Community", href: "/community", icon: Users },
  { name: "Radio", href: "/radio", icon: Radio },
  { name: "Vault", href: "/vault", icon: Vault },
  { name: "Coins", href: "/coins", icon: Coins },
  { name: "Meet & Greet", href: "/meet-greet", icon: Calendar },
  { name: "Merch", href: "/merch", icon: ShoppingBag },
]

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user, profile, signOut, isAuthenticated } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsOpen(false)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-5 gap-1 p-2">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              pathname === "/"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>

          <Link
            href="/community"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              pathname === "/community"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">Community</span>
          </Link>

          <Link
            href="/radio"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              pathname === "/radio"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Radio className="h-5 w-5" />
            <span className="text-xs mt-1">Radio</span>
          </Link>

          <Link
            href="/vault"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              pathname === "/vault"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Vault className="h-5 w-5" />
            <span className="text-xs mt-1">Vault</span>
          </Link>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center justify-center py-2 px-1 h-auto text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Menu className="h-5 w-5" />
                <span className="text-xs mt-1">More</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col h-full">
                {/* User Profile Section */}
                {isAuthenticated && profile ? (
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg mb-6">
                    <Avatar className="h-12 w-12 ring-2 ring-white/20">
                      <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {profile.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{profile.full_name || profile.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <UserTierBadge tier={profile.tier} />
                        <CoinBalance coins={profile.coins_balance} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg mb-6">
                    <p className="text-sm text-muted-foreground mb-3">Join the Erigga community</p>
                    <div className="flex gap-2">
                      <Button asChild size="sm" className="flex-1">
                        <Link href="/login" onClick={() => setIsOpen(false)}>
                          Sign In
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Link href="/signup" onClick={() => setIsOpen(false)}>
                          Sign Up
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Navigation Items */}
                <nav className="flex-1 space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </nav>

                {/* User Actions */}
                {isAuthenticated && (
                  <div className="border-t pt-4 space-y-2">
                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <User className="h-5 w-5" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      href="/premium"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Crown className="h-5 w-5" />
                      <span>Premium</span>
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="w-full justify-start gap-3 px-3 py-2 text-muted-foreground hover:text-foreground"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Sign Out</span>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  )
}
