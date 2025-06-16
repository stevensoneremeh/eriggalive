"use client"

import type React from "react"

import { ResponsiveSidebar } from "./responsive-sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <ResponsiveSidebar>{children}</ResponsiveSidebar>
}
