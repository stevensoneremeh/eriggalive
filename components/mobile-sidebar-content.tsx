"use client"

import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Users, BookOpen, Music, Ticket, Crown, ShoppingBag, Settings, LogOut, User, Wallet } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { DynamicLogo } from "@/components/dynamic-logo"
import { CoinBalance } from "@/components/coin-balance"
import { UserTierBadge } from "@/components/user-tier-badge"

const FEATURE_UI_FIXES_V1 = process.env.NEXT_PUBLIC_FEATURE_UI_FIXES_V1 === "true"

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  description?: string
  category?: "main" | "secondary" | "settings"
}

const sidebarItems: SidebarItem[] = [
  {
    name: "Home",
    href: "/",
    icon: Home,
    description: "Overview and stats",
    category: "main",
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Overview and stats",
    category: "main",
  },
  {
    name: "Community",
    href: "/community",
    icon: Users,
    badge: "New",
    description: "Connect with fans",
    category: "main",
  },
  {
    name: "Chronicles",
    href: "/chronicles",
    icon: BookOpen,
    description: "Latest stories and news",
    category: "main",
  },
  {
    name: "Media Vault",
    href: "/vault",
    icon: Music,
    description: "Exclusive content",
    category: "main",
  },
  {
    name: "Tickets",
    href: "/tickets",
    icon: Ticket,
    description: "Events and shows",
    category: "secondary",
  },
  {
    name: "Premium",
    href: "/premium",
    icon: Crown,
    description: "Upgrade your tier",
    category: "secondary",
  },
  {
    name: "Merch",
    href: "/merch",
    icon: ShoppingBag,
    description: "Official merchandise",
    category: "secondary",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Account preferences",
    category: "settings",
  },
]

export function MobileSidebarContent() {
  const { user, profile, signOut } = useAuth()

  const NavigationItem = ({ item }: { item: SidebarItem }) => {
    const Icon = item.icon

    return (
      <Link href={item.href} className="w-full">
        <Button
          variant="ghost"
          className="w-full justify-start h-11 transition-all duration-200 hover:bg-accent/50 group relative"
        >
          <Icon className="h-5 w-5 mr-3" />
          <span className="truncate font-medium">{item.name}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0.5 bg-primary/20 text-primary">
              {item.badge}
            </Badge>
          )}
        </Button>
      </Link>
    )
  }

  const UserSection = () => (
    <div className="p-4 border-b">
      <div className="flex items-center space-x-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} alt={profile?.username} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {profile?.username?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate text-sm">{profile?.username || "User"}</p>
          <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <UserTierBadge tier={profile?.tier || "grassroot"} size="sm" />
          </div>
        </div>
      </div>

      <div className="mt-3 p-2 bg-accent/30 rounded-lg">
        <CoinBalance coins={profile?.coins || 0} size="sm" />
      </div>
    </div>
  )

  const mainItems = sidebarItems.filter((item) => item.category === "main")
  const secondaryItems = sidebarItems.filter((item) => item.category === "secondary")
  const settingsItems = sidebarItems.filter((item) => item.category === "settings")

  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Link href="/" className="flex items-center space-x-2">
          <DynamicLogo responsive={false} width={120} height={32} />
        </Link>
      </div>

      {/* User Section */}
      {user && profile && <UserSection />}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <div className="py-4 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Main</p>
            {mainItems.map((item) => (
              <NavigationItem key={item.name} item={item} />
            ))}
          </div>

          {/* Secondary Navigation */}
          {secondaryItems.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Services</p>
              {secondaryItems.map((item) => (
                <NavigationItem key={item.name} item={item} />
              ))}
            </div>
          )}

          {/* Settings */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Account</p>
            {settingsItems.map((item) => (
              <NavigationItem key={item.name} item={item} />
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Footer Actions - Mobile specific cleanup */}
      <div className="p-4 border-t">
        {FEATURE_UI_FIXES_V1 ? (
          // Mobile cleanup: Only show Settings and Sign Out
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          // Original layout
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
              <Link href="/profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
              <Link href="/wallet">
                <Wallet className="h-4 w-4 mr-2" />
                Wallet
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
