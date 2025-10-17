"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Menu,
  Home,
  User,
  Coins,
  ShoppingBag,
  Calendar,
  Radio,
  ImageIcon,
  Crown,
  MessageSquare,
  LogOut,
  Settings,
  Ticket,
  Wallet,
  TrendingUp,
  Gamepad2,
  Video,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Vault", href: "/vault", icon: ImageIcon },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Wallet", href: "/wallet", icon: Wallet },
  { name: "Coins", href: "/coins", icon: Coins },
  { name: "Radio", href: "/radio", icon: Radio },
  { name: "Media", href: "/media", icon: Video },
  { name: "Community", href: "/community", icon: MessageSquare },
  { name: "Games", href: "/games", icon: Gamepad2 },
  { name: "Merch", href: "/merch", icon: ShoppingBag },
  { name: "Premium", href: "/premium", icon: Crown },
  { name: "Missions", href: "/missions", icon: TrendingUp },
  { name: "Settings", href: "/settings", icon: Settings },
]

const tierColors = {
  erigga_citizen: "bg-gray-500 text-white",
  erigga_indigen: "bg-brand-teal text-white",
  enterprise: "bg-brand-lime text-brand-teal",
}

const tierLabels = {
  erigga_citizen: "Citizen",
  erigga_indigen: "Indigen",
  enterprise: "Enterprise",
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=" + encodeURIComponent(pathname || "/dashboard"))
    }
  }, [user, router, pathname])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal"></div>
      </div>
    )
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname?.startsWith(href)
  }

  const userTier = (profile?.tier || "erigga_citizen") as keyof typeof tierColors
  const tierColor = tierColors[userTier] || tierColors.erigga_citizen
  const tierLabel = tierLabels[userTier] || tierLabels.erigga_citizen

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* User Profile Section */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.avatar_url || profile.profile_image_url || ""} alt={profile.username} />
            <AvatarFallback>{profile.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{profile.full_name || profile.username}</p>
            <p className="text-xs text-gray-500 truncate">@{profile.username}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Badge className={cn("text-xs", tierColor)}>{tierLabel}</Badge>
          <div className="flex items-center text-xs text-gray-600">
            <Coins className="h-3 w-3 mr-1" />
            <span>{profile.coins || 0}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <nav className="py-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all",
                  active
                    ? "bg-brand-teal text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                )}
                onClick={() => isMobile && setIsMobileMenuOpen(false)}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => {
            signOut()
            if (isMobile) setIsMobileMenuOpen(false)
            router.push("/")
          }}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 bg-white dark:bg-gray-800 border-r shadow-sm">
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 lg:hidden bg-white dark:bg-gray-800 shadow-md"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SidebarContent isMobile />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
