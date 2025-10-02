import type React from "react"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  Ticket,
  CreditCard,
  ImageIcon,
  Calendar,
  Upload,
  Wrench,
  Palette,
  TrendingUp,
  QrCode,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login?redirect=/admin")
  }

  // Check if user has admin role
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role, email, tier, is_active")
    .eq("auth_user_id", user.id)
    .single()

  // Also check profiles table as fallback
  let hasAdminAccess = false

  if (profile) {
    hasAdminAccess = profile.role === "admin" || profile.role === "super_admin"
  }

  // Fallback: check profiles table
  if (!hasAdminAccess) {
    const { data: altProfile } = await supabase.from("profiles").select("role, email").eq("id", user.id).single()

    if (altProfile) {
      hasAdminAccess = altProfile.role === "admin"
    }
  }

  // Special case: always grant access to info@eriggalive.com
  if (user.email === "info@eriggalive.com") {
    hasAdminAccess = true
  }

  if (!hasAdminAccess) {
    redirect("/dashboard")
  }

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Overview" },
    { href: "/admin/dashboard", icon: TrendingUp, label: "Dashboard" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/admin/events", icon: Calendar, label: "Events" },
    { href: "/admin/tickets", icon: Ticket, label: "Tickets" },
    { href: "/admin/transactions", icon: CreditCard, label: "Transactions" },
    { href: "/admin/withdrawals", icon: CreditCard, label: "Withdrawals" },
    { href: "/admin/media", icon: ImageIcon, label: "Media" },
    { href: "/admin/upload", icon: Upload, label: "Upload" },
    { href: "/admin/branding", icon: Palette, label: "Branding" },
    { href: "/admin/health", icon: Wrench, label: "System Health" },
    { href: "/admin/scanner", icon: QrCode, label: "QR Scanner" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Admin Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-lime to-brand-teal bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your Erigga Live platform</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Logged in as</p>
                <p className="font-semibold text-brand-teal dark:text-brand-lime">{user.email}</p>
              </div>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-brand-lime text-brand-teal rounded-lg hover:bg-brand-lime-dark transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Admin Menu</CardTitle>
                <CardDescription>Navigate through admin sections</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-brand-lime/10 hover:text-brand-teal dark:hover:text-brand-lime transition-colors"
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9">
            <Card>
              <CardContent className="p-6">{children}</CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  )
}
