"use client"
import { useEffect, useState } from "react"
import type React from "react"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModernThemeToggle } from "@/components/modern-theme-toggle"
import { LayoutDashboard, Upload, Settings, Users, CreditCard, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const adminNavItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Media", href: "/admin/media", icon: Upload },
  { name: "Transactions", href: "/admin/transactions", icon: CreditCard },
  { name: "Branding", href: "/admin/branding", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const pathname = usePathname()
  const [ok, setOk] = useState<boolean | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)

  useEffect(() => {
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return setOk(false)

      const { data, error } = await supabase
        .from("profiles")
        .select("role, tier, username, is_admin")
        .eq("id", session.user.id)
        .single()

      if (error || !data || (data.role !== "admin" && data.tier !== "blood_brotherhood" && !data.is_admin)) {
        setOk(false)
      } else {
        setOk(true)
        setUserInfo(data)
      }
    })()
  }, [supabase])

  if (ok === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (ok === false) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Unauthorized Access</h1>
          <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 bg-muted/30 border-r flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold mb-2">Admin Panel</h2>
          <p className="text-sm text-muted-foreground mb-4">Welcome, {userInfo?.username}</p>
          <Link href="/">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Site
            </Button>
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {adminNavItems.map((item) => {
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

        <div className="p-4 border-t">
          <ModernThemeToggle />
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  )
}
