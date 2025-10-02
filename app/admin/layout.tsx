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
  AlertTriangle,
  Video,
  Phone,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

const adminNavItems = [
  { name: "Overview", href: "/admin", icon: Home },
  { name: "Dashboard", href: "/admin/dashboard", icon: TrendingUp },
  { name: "Scanner", href: "/admin/scanner", icon: Scan },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Events", href: "/admin/events", icon: Calendar },
  { name: "Transactions", href: "/admin/transactions", icon: CreditCard },
  { name: "Withdrawals", href: "/admin/withdrawals", icon: CreditCard },
  { name: "Live Streaming", href: "/admin/live", icon: Video },
  { name: "Video Calls", href: "/admin/video-calls", icon: Phone },
  { name: "Vault Management", href: "/admin/vault-management", icon: Shield },
  { name: "Media", href: "/admin/media", icon: ImageIcon },
  { name: "Upload", href: "/admin/upload", icon: Upload },
  { name: "Branding", href: "/admin/branding", icon: Palette },
  { name: "Health", href: "/admin/health", icon: Wrench },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        console.log("[Admin Layout] Starting admin access check...")

        // Check if user is authenticated first
        if (!user) {
          console.log("[Admin Layout] No user found in context")
          setHasAccess(false)
          // Don't redirect immediately - wait a bit for auth to initialize
          const timer = setTimeout(() => {
            if (!user) {
              router.push("/login?redirect=" + encodeURIComponent(pathname || "/admin"))
            }
          }, 1000)
          return () => clearTimeout(timer)
        }

        const userEmail = user.email || ""
        console.log("[Admin Layout] User email:", userEmail)

        // Special case: Always allow info@eriggalive.com
        if (userEmail === "info@eriggalive.com") {
          console.log("[Admin Layout] ✅ Special access granted to info@eriggalive.com")
          setHasAccess(true)
          setDebugInfo({ method: "special_email", email: userEmail })
          setError(null)
          return
        }

        // Check profile from context first
        if (profile) {
          console.log("[Admin Layout] Profile from context:", {
            role: profile.role,
            tier: profile.tier,
            email: profile.email,
          })

          // Allow admin or super_admin role
          if (profile.role === "admin" || profile.role === "super_admin") {
            console.log("[Admin Layout] ✅ Access granted via profile context")
            setHasAccess(true)
            setDebugInfo({ method: "profile_context", role: profile.role })
            setError(null)
            return
          }

          // Also check if user is blood tier (alternative admin access)
          if (profile.tier === "blood" || profile.tier === "blood_brotherhood") {
            console.log("[Admin Layout] ✅ Access granted via blood tier")
            setHasAccess(true)
            setDebugInfo({ method: "tier_access", tier: profile.tier })
            setError(null)
            return
          }
        }

        // Fallback: Direct database check (with timeout)
        console.log("[Admin Layout] Checking database for admin role...")
        
        const dbCheckPromise = supabase
          .from("users")
          .select("role, tier, email, is_active")
          .eq("auth_user_id", user.id)
          .single()

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Database check timeout")), 5000)
        )

        const { data: userData, error: userError } = await Promise.race([
          dbCheckPromise,
          timeoutPromise
        ]).catch((err) => ({ data: null, error: err }))

        if (userError) {
          console.error("[Admin Layout] Database error:", userError)
          // If we have a profile from context, use that instead of failing
          if (profile) {
            console.log("[Admin Layout] Using profile from context due to database error")
            const hasContextAccess = 
              profile.role === "admin" || 
              profile.role === "super_admin" ||
              profile.tier === "blood" || 
              profile.tier === "blood_brotherhood"
            
            setHasAccess(hasContextAccess)
            if (!hasContextAccess) {
              setError("You do not have admin privileges")
            } else {
              setError(null)
              setDebugInfo({ method: "profile_fallback", role: profile.role, tier: profile.tier })
            }
            return
          }
          
          setError(`Database error: ${userError.message}`)
          setHasAccess(false)
          return
        }

        if (userData) {
          console.log("[Admin Layout] Database user data:", userData)

          const hasDbAccess = 
            userData.role === "admin" || 
            userData.role === "super_admin" ||
            userData.tier === "blood" || 
            userData.tier === "blood_brotherhood"

          if (hasDbAccess) {
            console.log("[Admin Layout] ✅ Access granted via database")
            setHasAccess(true)
            setDebugInfo({ method: "database", role: userData.role, tier: userData.tier })
            setError(null)
            return
          }
        }

        // No admin access found
        console.log("[Admin Layout] ❌ Access denied - not an admin")
        setError("You do not have admin privileges")
        setHasAccess(false)
      } catch (err: any) {
        console.error("[Admin Layout] Unexpected error:", err)
        setError(`Unexpected error: ${err.message}`)
        setHasAccess(false)
      }
    }

    checkAdminAccess()
  }, [user, profile, supabase, router, pathname])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Loading state
  if (hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-teal"></div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Verifying admin access...</p>
            {user?.email && <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Access denied state
  if (hasAccess === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8 space-y-4">
            <Shield className="h-16 w-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h1>
            <p className="text-gray-600 dark:text-gray-300">You don't have permission to access the admin panel.</p>

            {user?.email && (
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Logged in as: <span className="font-semibold text-gray-900 dark:text-white">{user.email}</span>
                </p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {debugInfo && (
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-left">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  Debug: {JSON.stringify(debugInfo, null, 2)}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-4">
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Return Home</Link>
              </Button>
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
            </div>
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
        {user?.email && (
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-brand-teal">{user.email}</span>
          </div>
        )}
      </div>

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
                  "flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200",
                  active
                    ? "bg-brand-teal text-white shadow-md"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                )}
                onClick={() => isMobile && setIsMobileMenuOpen(false)}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
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
        <aside className="hidden lg:flex w-64 xl:w-72 bg-white dark:bg-gray-800 border-r shadow-sm">
          <SidebarContent />
        </aside>

        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 lg:hidden bg-white dark:bg-gray-800 shadow-md"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SidebarContent isMobile />
          </SheetContent>
        </Sheet>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
