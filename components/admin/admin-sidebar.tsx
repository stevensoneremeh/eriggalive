"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  FileText,
  Upload,
  Settings,
  DollarSign,
  BarChart3,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Posts",
    href: "/admin/posts",
    icon: FileText,
  },
  {
    title: "Media Upload",
    href: "/admin/media",
    icon: Upload,
  },
  {
    title: "Transactions",
    href: "/admin/transactions",
    icon: DollarSign,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Security",
    href: "/admin/security",
    icon: Shield,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className={cn("bg-card border-r transition-all duration-300", collapsed ? "w-16" : "w-64")}>
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && <h2 className="text-lg font-semibold">Admin Panel</h2>}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="p-4 space-y-2">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn("w-full justify-start", collapsed && "px-2")}
              >
                <item.icon className="h-4 w-4" />
                {!collapsed && <span className="ml-2">{item.title}</span>}
              </Button>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
