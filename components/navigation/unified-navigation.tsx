"use client"
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
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <>
      <DesktopNavigation />
      <MobileNavigation />
    </>
  )
}
