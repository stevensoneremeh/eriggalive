"use client"
import { useEffect, useState } from "react"
import type React from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Menu,
  Home,
  Users,
  CreditCard,
  ImageIcon,
  LogOut,
  Shield,
  X,
  Scan,
  Calendar,
  Upload,
  Wrench,
  Palette,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"

const adminNavItems = [
  { name: "Overview", href: "/admin", icon: Home },
  { name: "Dashboard", href: "/admin/dashboard", icon: TrendingUp },
  { name: "Scanner", href: "/admin/scanner", icon: Scan },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Events", href: "/admin/events", icon: Calendar },
  { name: "Transactions", href: "/admin/transactions", icon: CreditCard },
  { name: "Withdrawals", href: "/admin/withdrawals", icon: CreditCard },
  { name: "Media", href: "/admin/media", icon: ImageIcon },
  { name: "Upload", href: "/admin/upload", icon: Upload },
  { name: "Branding", href: "/admin/branding", icon: Palette },
  { name: "Health", href: "/admin/health", icon: Wrench },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const { signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [ok, setOk] = useState<boolean | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAccess() {
      try {
        console.log("[Admin] Checking admin access...")

        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("[Admin] Session error:", sessionError)
          setError("Session error: " + sessionError.message)
          setOk(false)
          return
        }

        if (!session) {
          console.log("[Admin] No session found, redirecting to login")
          setOk(false)
          router.push("/login?redirect=/admin")
          return
        }

        const userEmail = session.user.email || ""
        setUserEmail(userEmail)
        console.log("[Admin] User email:", userEmail)

        // Special case: Always allow info@eriggalive.com
        if (userEmail === "info@eriggalive.com") {
          console.log("[Admin] ✅ Granting access to info@eriggalive.com")
          setOk(true)
          return
        }

        // Check users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role, tier, is_active")
          .eq("auth_user_id", session.user.id)
          .single()

        if (userError) {
          console.error("[Admin] User lookup error:", userError)
          // Try profiles table as fallback
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single()

          if (profileError) {
            console.error("[Admin] Profile lookup error:", profileError)
            setError("Access denied: User not found")
            setOk(false)
            return
          }

          if (profileData?.role === "admin") {
            console.log("[Admin] ✅ Access granted via profiles table")
            setOk(true)
            return
          }
        }

        if (userData) {
          console.log("[Admin] User data:", userData)

          if (userData.role === "admin" || userData.role === "super_admin") {
            console.log("[Admin] ✅ Access granted - Role:", userData.role)
            setOk(true)
            return
          }
        }

        console.log("[Admin] ❌ Access denied - Not an admin")
        setError("Access denied: Admin privileges required")
        setOk(false)
      } catch (err: any) {
        console.error("[Admin] Unexpected error:", err)
        setError("An unexpected error occurred: " + err.message)
        setOk(false)
      }
    }

    checkAccess()
  }, [supabase, router])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Loading state
  if (ok === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-teal"></div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Verifying admin access...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{userEmail || "Checking credentials"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Access denied state
  if (ok === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8 space-y-4">
            <Shield className="h-16 w-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h1>
            <p className="text-gray-600 dark:text-gray-300">You don't have permission to access the admin panel.</p>
            {userEmail && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Logged in as: <span className="font-semibold">{userEmail}</span>
              </p>
            )}
            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded relative">
                <p className="text-sm">{error}</p>
              </div>
            )}
            <div className="flex gap-2 justify-center pt-4">
              <Button asChild variant="outline">
                <Link href="/">Return Home</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                signOut()
                router.push("/login")
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              Sign out and try different account
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin"
    }
    return pathname?.startsWith(href)
  }

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-brand-lime to-brand-teal rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Admin Panel</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Management Dashboard</p>
            </div>
          </div>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        {userEmail && (
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
            Logged in as: <span className="font-semibold text-brand-teal">{userEmail}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 sm:px-4">
        <nav className="py-4 space-y-2">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                  active
                    ? "bg-brand-teal text-white shadow-md"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white",
                )}
                onClick={() => isMobile && setIsMobileMenuOpen(false)}
              >
                <Icon className={cn("h-5 w-5 transition-colors", active && "text-white")} />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => {
            signOut()
            if (isMobile) setIsMobileMenuOpen(false)
            router.push("/login")
          }}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 xl:w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm">
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 lg:hidden bg-white dark:bg-gray-800 shadow-md border"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SidebarContent isMobile />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
