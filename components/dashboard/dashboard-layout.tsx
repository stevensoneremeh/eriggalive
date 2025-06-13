"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Music,
  MessageSquare,
  Ticket,
  ShoppingBag,
  FileText,
  Settings,
  Menu,
  X,
  Bell,
  Search,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CoinBalance } from "@/components/coin-balance"
import { DynamicLogo } from "@/components/dynamic-logo"
import { useTheme } from "@/contexts/theme-context"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Media Vault", href: "/vault", icon: Music },
  { name: "Community", href: "/community", icon: MessageSquare },
  { name: "Events", href: "/tickets", icon: Ticket },
  { name: "Merch", href: "/merch", icon: ShoppingBag },
  { name: "Chronicles", href: "/chronicles", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { profile } = useAuth()
  const { theme } = useTheme()

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("sidebar")
      if (sidebar && !sidebar.contains(event.target as Node) && window.innerWidth < 1024) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [pathname])

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to access the dashboard</h1>
          <Button asChild className="brand-button">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu className="h-6 w-6" />
        </Button>
        <DynamicLogo width={120} height={32} />
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
          <AvatarFallback>{profile.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>

      {/* Sidebar */}
      <div
        id="sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-full flex flex-col border-r">
          {/* Sidebar Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <DynamicLogo width={120} height={32} />
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Profile */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{profile.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{profile.username}</div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    theme === "dark" ? "bg-harkonnen-dark-gray text-white" : "bg-brand-lime-light text-brand-teal",
                  )}
                >
                  {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)}
                </Badge>
              </div>
            </div>
            <div className="mt-3">
              <CoinBalance size="sm" />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-2">
            <nav className="space-y-1 px-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? theme === "dark"
                          ? "bg-harkonnen-dark-gray text-white"
                          : "bg-brand-lime-light text-brand-teal"
                        : "hover:bg-accent",
                    )}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t">
            <div className="text-xs text-muted-foreground">
              <p>Erigga Live Platform</p>
              <p>© 2024 All rights reserved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-10 w-64 bg-background" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            </Button>
            <div className="flex items-center space-x-3">
              <div className="text-right hidden md:block">
                <div className="font-medium">{profile.username}</div>
                <div className="text-xs text-muted-foreground">Level {profile.level}</div>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{profile.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
