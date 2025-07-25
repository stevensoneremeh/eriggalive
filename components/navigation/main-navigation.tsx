"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, User, LogOut, Settings, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { DynamicLogo } from "@/components/dynamic-logo"
import { ThemeToggle } from "@/components/theme-toggle"

const navigationItems = [
  { name: "Home", href: "/" },
  { name: "Community", href: "/community" },
  { name: "Vault", href: "/vault" },
  { name: "Meet & Greet", href: "/meet-greet" },
  { name: "Radio", href: "/radio" },
  { name: "Merch", href: "/merch" },
]

const tierColors = {
  grassroot: "bg-green-500",
  pioneer: "bg-blue-500",
  elder: "bg-purple-500",
  blood: "bg-red-500",
}

export function MainNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <DynamicLogo className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === item.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {user && profile ? (
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
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{profile.full_name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">@{profile.username}</p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${tierColors[profile.tier as keyof typeof tierColors] || "bg-gray-500"}`}
                        >
                          {profile.tier}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Coins className="h-3 w-3" />
                          {profile.coin_balance}
                        </div>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/coins">
                      <Coins className="mr-2 h-4 w-4" />
                      Coins
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
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
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 text-base font-medium transition-colors hover:text-primary ${
                    pathname === item.href ? "text-primary bg-primary/10" : "text-muted-foreground"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {user && profile && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center px-3 py-2">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.username} />
                        <AvatarFallback>{profile.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{profile.full_name}</p>
                        <p className="text-xs text-muted-foreground">@{profile.username}</p>
                      </div>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/coins"
                      className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      Coins ({profile.coin_balance})
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-primary"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
