"use client"

import type React from "react"

import { useRouter, usePathname } from "next/navigation"
import { useCallback } from "react"

export interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  description?: string
  category?: "main" | "secondary" | "settings"
}

export function useNavigation() {
  const router = useRouter()
  const pathname = usePathname()

  const navigateToHome = useCallback(() => {
    router.push("/")
  }, [router])

  const navigateTo = useCallback(
    (href: string) => {
      router.push(href)
    },
    [router],
  )

  const isActive = useCallback(
    (href: string) => {
      if (href === "/") {
        return pathname === "/" // Only active when exactly on home page
      }
      if (href === "/dashboard") {
        return pathname === "/dashboard" || pathname?.startsWith("/dashboard/")
      }
      return pathname?.startsWith(href)
    },
    [pathname],
  )

  const isHomePage = pathname === "/"
  const isDashboardPage = pathname === "/dashboard" || pathname?.startsWith("/dashboard/")

  return {
    pathname,
    navigateToHome,
    navigateTo,
    isActive,
    isHomePage,
    isDashboardPage,
  }
}
