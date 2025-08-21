"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, Upload, CreditCard, Settings, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const sidebarItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Media", href: "/admin/media", icon: Upload },
  { name: "Transactions", href: "/admin/transactions", icon: CreditCard },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-muted/30 border-r flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">Admin Panel</h2>
        <Link href="/">
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Site
          </Button>
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn("w-full justify-start", isActive && "bg-primary text-primary-foreground")}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.name}
                  </Button>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
