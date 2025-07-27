"use client"
import { MobileNavigation } from "./mobile-navigation"
import { DesktopNavigation } from "./desktop-navigation"

export function UnifiedNavigation() {
  return (
    <>
      <DesktopNavigation />
      <MobileNavigation />
    </>
  )
}
