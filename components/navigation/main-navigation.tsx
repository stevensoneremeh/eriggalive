"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { UnifiedNavigation } from "./unified-navigation"

export function MainNavigation() {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <UnifiedNavigation />
}
