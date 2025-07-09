"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
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
import { Menu, Moon, Sun, User, Settings, LogOut, Coins } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { DynamicLogo } from "@/components/dynamic-logo"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Home", href: "/" },
  { name: "Community", href: "/community" },
  { name: "Vault", href: "/vault" },
  { name: "Chronicles", href: "/chronicles" },
  { name: "Merch", href: "/merch" },
  { name: "Tickets", href: "/tickets" },
]

const getTierColor = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case "grassroot":
      return "bg-green-500"
    case "pioneer":
      return "bg-blue-500"
    case "elder":
      return "bg-yellow-500"
    case "blood":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

export function MainNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user, profile, signOut, loading } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <DynamicLogo className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            {/* User Menu or Auth Buttons */}
            {user && profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile.avatar_url || ""} alt={profile.username || ""} />
                      <AvatarFallback>{profile.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <Badge
                      className={cn("absolute -bottom-1 -right-1 h-4 w-4 p-0 text-xs", getTierColor(profile.tier))}
                    >
                      {profile.tier?.charAt(0).toUpperCase()}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile.full_name || profile.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getTierColor(profile.tier)}>{profile.tier?.toUpperCase()}</Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Coins className="h-3 w-3" />
                          {profile.coins || 0}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
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
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-4">
                  {/* User Info in Mobile */}
                  {user && profile && (
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar_url || ""} alt={profile.username || ""} />
                        <AvatarFallback>{profile.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{profile.full_name || profile.username}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getTierColor(profile.tier)}>{profile.tier?.toUpperCase()}</Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Coins className="h-3 w-3" />
                            {profile.coins || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Links */}
                  <div className="space-y-2">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          pathname === item.href
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent",
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>

                  {/* Auth Actions */}
                  {user && profile ? (
                    <div className="space-y-2 pt-4 border-t">
                      <Link
                        href="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setIsOpen(false)}
                        className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-4 border-t">
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/signup" onClick={() => setIsOpen(false)}>
                        <Button className="w-full">Sign Up</Button>
                      </Link>
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
