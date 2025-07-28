"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { DesktopNavigation } from "./desktop-navigation"
import { MobileNavigation } from "./mobile-navigation"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "next-themes"

const NAVIGATION_ITEMS = [
  { href: "/", label: "Home", icon: "Home" },
  { href: "/mission", label: "Mission", icon: "Target" },
  { href: "/community", label: "Community", icon: "Users" },
  { href: "/chronicles", label: "Chronicles", icon: "BookOpen" },
  { href: "/vault", label: "Vault", icon: "Vault" },
  { href: "/tickets", label: "Tickets", icon: "Ticket" },
  { href: "/premium", label: "Premium", icon: "Crown" },
  { href: "/merch", label: "Merch", icon: "ShoppingBag" },
  { href: "/coins", label: "Coins", icon: "Coins" },
]

export function UnifiedNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error("signOut error:", err)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
            <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      <DesktopNavigation />
      <MobileNavigation />
    </>
  )
}
