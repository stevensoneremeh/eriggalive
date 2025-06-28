"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  Menu,
  X,
  Home,
  Users,
  LayoutDashboard,
  Music,
  BookOpen,
  Ticket,
  Crown,
  ShoppingBag,
  LogIn,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Bell,
  Search,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CoinBalance } from "@/components/coin-balance"
import { UserTierBadge } from "@/components/user-tier-badge"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { cn } from "@/lib/utils"
import { DynamicLogo } from "@/components/dynamic-logo"

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  showOnMobile?: boolean
  authOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { name: "Home", href: "/", icon: Home, showOnMobile: true },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, showOnMobile: true, authOnly: true },
  { name: "Community", href: "/community", icon: Users, badge: "New", showOnMobile: true },
  { name: "Media Vault", href: "/vault", icon: Music, showOnMobile: true },
  { name: "Chronicles", href: "/chronicles", icon: BookOpen },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Premium", href: "/premium", icon: Crown },
  { name: "Merch", href: "/merch", icon: ShoppingBag },
]

type Screen = "mobile" | "tablet" | "desktop"

/**
 * Responsive top-nav + bottom-bar + drawer that works with our custom
 * Auth / Theme contexts.  Home and logo ALWAYS go to “/”.
 */
export function UnifiedNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  const { user, profile, signOut, isAuthenticated, isLoading: authLoading } = useAuth()
  const { theme, setTheme, isLoading: themeLoading } = useTheme()

  /* UI state */
  const [mounted, setMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [screen, setScreen] = useState<Screen>("desktop")

  /* --- helpers ----------------------------------------------------------- */
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : href === "/dashboard"
        ? pathname === "/dashboard" || pathname.startsWith("/dashboard/")
        : pathname.startsWith(href) && pathname !== "/"

  const visibleItems = NAV_ITEMS.filter((i) => !(i.authOnly && !isAuthenticated))
  const mobileItems = visibleItems.filter((i) => i.showOnMobile)

  const handleNav = (href: string) => {
    router.push(href)
    setDrawerOpen(false)
  }

  /* --- side-effects ------------------------------------------------------ */
  const updateScreen = useCallback(() => {
    if (typeof window === "undefined") return
    const w = window.innerWidth
    if (w < 768) setScreen("mobile")
    else if (w < 1024) setScreen("tablet")
    else setScreen("desktop")
  }, [])

  useEffect(() => {
    setMounted(true)
    updateScreen()
    const onResize = () => updateScreen()
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("resize", onResize)
    window.addEventListener("scroll", onScroll)
    return () => {
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", onScroll)
    }
  }, [updateScreen])

  /* --- render ------------------------------------------------------------ */
  if (!mounted || themeLoading) return null

  /* MOBILE (top header + bottom bar) */
  if (screen === "mobile") {
    return (
      <>
        {/* Top Header */}
        <header
          className={cn(
            "fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between px-4 transition-colors",
            isScrolled ? "bg-background/90 backdrop-blur-md shadow" : "bg-background/60 backdrop-blur",
          )}
        >
          <Link href="/" className="flex items-center">
            <DynamicLogo width={100} height={28} />
          </Link>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <Button variant="ghost" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500" />
                </Button>
              </>
            )}

            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <MobileDrawer
                  items={visibleItems}
                  active={(href) => isActive(href)}
                  onNavigate={handleNav}
                  onClose={() => setDrawerOpen(false)}
                />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Bottom bar */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-md">
          <div className="flex items-center justify-around py-2">
            {mobileItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors",
                    active
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
                  )}
                >
                  <span className="relative">
                    <Icon className="h-5 w-5" />
                    {item.badge && (
                      <Badge
                        variant="secondary"
                        className="absolute -top-2 -right-2 h-4 w-4 p-0 text-[10px] bg-red-500 text-white"
                      >
                        {typeof item.badge === "number" && item.badge > 9 ? "9+" : item.badge}
                      </Badge>
                    )}
                  </span>
                  {item.name}
                </Link>
              )
            })}

            {/* More */}
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 p-2 text-xs"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" />
              More
            </Button>
          </div>
        </nav>
      </>
    )
  }

  /* DESKTOP/TABLET */
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors",
        isScrolled ? "bg-background/90 backdrop-blur-md shadow" : "bg-background/60 backdrop-blur",
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* logo */}
        <Link href="/" className="flex items-center space-x-2">
          <DynamicLogo width={120} height={32} />
        </Link>

        {/* centre nav (desktop only) */}
        <nav className="hidden lg:flex flex-1 items-center justify-center gap-1">
          {visibleItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  active
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
                )}
              >
                {item.name}
                {item.badge && (
                  <Badge variant="secondary" className="ml-2 bg-red-500 text-white">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>

        {/* right side */}
        <div className="flex items-center gap-2">
          {/* theme toggle */}
          <div className="hidden md:flex gap-1">
            {[
              { v: "light", icon: Sun },
              { v: "dark", icon: Moon },
              { v: "system", icon: Monitor },
            ].map(({ v, icon: Icon }) => (
              <Button
                key={v}
                variant="ghost"
                size="icon"
                onClick={() => setTheme(v as any)}
                className={cn(theme === v && "bg-accent text-accent-foreground")}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>

          {!authLoading &&
            (isAuthenticated && profile ? (
              <>
                <CoinBalance coins={profile.coins} size="sm" />
                <UserTierBadge tier={profile.tier} />
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                  onClick={async () => {
                    await signOut()
                    router.push("/")
                  }}
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    <LogIn className="h-4 w-4 mr-1" /> Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            ))}

          {/* hamburger for tablet */}
          {screen === "tablet" && (
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <MobileDrawer
                  items={visibleItems}
                  active={(href) => isActive(href)}
                  onNavigate={handleNav}
                  onClose={() => setDrawerOpen(false)}
                />
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  )
}

/* ----------------------------------------------------------------------- */
/* ------------------------------- helpers ------------------------------- */
/* ----------------------------------------------------------------------- */

interface DrawerProps {
  items: NavItem[]
  active: (href: string) => boolean
  onNavigate: (href: string) => void
  onClose: () => void
}
function MobileDrawer({ items, active, onNavigate }: DrawerProps) {
  const { isAuthenticated, profile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="flex items-center justify-between border-b p-4">
        <Link href="/" onClick={() => onNavigate("/")}>
          <DynamicLogo width={100} height={28} />
        </Link>
        <Button variant="ghost" size="icon" onClick={() => onNavigate("#")}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* user info */}
      {isAuthenticated && profile && (
        <div className="border-b bg-accent/20 p-4">
          <div className="mb-3 flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
              <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-semibold">{profile.username}</p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
              <UserTierBadge tier={profile.tier} size="sm" className="mt-1" />
            </div>
          </div>
          <CoinBalance coins={profile.coins} size="sm" />
        </div>
      )}

      {/* nav items */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.map((item) => {
          const Icon = item.icon
          const act = active(item.href)
          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                act ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1 font-medium">{item.name}</span>
              {item.badge && (
                <Badge variant="secondary" className="bg-red-500 text-white">
                  {item.badge}
                </Badge>
              )}
            </button>
          )
        })}
      </div>

      {/* footer */}
      <div className="border-t p-4">
        {/* theme toggle */}
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium">Appearance</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: "light", label: "Light", icon: Sun },
              { v: "dark", label: "Dark", icon: Moon },
              { v: "system", label: "Auto", icon: Monitor },
            ].map(({ v, label, icon: Icon }) => (
              <Button
                key={v}
                variant={theme === v ? "default" : "outline"}
                className="flex flex-col items-center gap-1 py-3 text-xs"
                onClick={() => setTheme(v as any)}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {isAuthenticated ? (
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600"
            onClick={async () => {
              await signOut()
              onNavigate("/")
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <Link href="/login" onClick={() => onNavigate("/login")}>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            </Link>
            <Link href="/signup" onClick={() => onNavigate("/signup")}>
              <Button className="w-full justify-start">Sign Up</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

/* provide default **and** named export */
export default UnifiedNavigation
