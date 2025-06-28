"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Home, Users, Coins, Trophy, Music, Ticket, Crown, LogOut } from "lucide-react"
import { DynamicLogo } from "@/components/dynamic-logo"
import { UserTierBadge } from "@/components/user-tier-badge"
import { CoinBalance } from "@/components/coin-balance"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface NavigationProps {
  user?: User | null
}

export function UnifiedNavigation({ user }: NavigationProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    if (user) {
      fetchUserProfile()
    }
  }, [user])

  const fetchUserProfile = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("users").select("*").eq("auth_user_id", user?.id).single()

    setUserProfile(data)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const navigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/community", label: "Community", icon: Users },
    { href: "/coins", label: "Coins", icon: Coins },
    { href: "/vault", label: "Vault", icon: Trophy },
    { href: "/chronicles", label: "Chronicles", icon: Music },
    { href: "/tickets", label: "Tickets", icon: Ticket },
    { href: "/premium", label: "Premium", icon: Crown },
  ]

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Always links to / */}
          <Link href="/" className="flex items-center space-x-2">
            <DynamicLogo className="h-8 w-8" />
            <span className="font-bold text-xl">EriggaLive</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <CoinBalance />
                <UserTierBadge tier={userProfile?.tier || "grassroot"} />
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden md:flex">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
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
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  {user && (
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{userProfile?.display_name || userProfile?.username}</p>
                        <UserTierBadge tier={userProfile?.tier || "grassroot"} />
                      </div>
                      <CoinBalance />
                    </div>
                  )}

                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                        isActive(item.href)
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  ))}

                  {user ? (
                    <Button variant="ghost" onClick={handleSignOut} className="justify-start px-4 py-3 h-auto">
                      <LogOut className="h-5 w-5 mr-3" />
                      Sign Out
                    </Button>
                  ) : (
                    <div className="flex flex-col space-y-2 px-4">
                      <Button variant="ghost" asChild>
                        <Link href="/login" onClick={() => setIsOpen(false)}>
                          Sign In
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link href="/signup" onClick={() => setIsOpen(false)}>
                          Sign Up
                        </Link>
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
