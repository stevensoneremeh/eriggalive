"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  MessageSquare,
  Coins,
  TrendingUp,
  Shield,
  Eye,
  UserCheck,
  UserX,
  AlertTriangle,
  Lock,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AdminStats {
  totalUsers: number
  totalPosts: number
  totalComments: number
  totalCoins: number
  activeUsers: number
  recentSignups: number
}

interface User {
  id: string
  email: string
  username: string
  display_name: string
  tier: string
  coins_balance: number
  created_at: string
  is_active: boolean
}

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  // Check if user is admin
  const isAdmin = user?.email === "admin@eriggalive.com"

  useEffect(() => {
    if (!isAdmin) {
      router.push("/")
      return
    }

    // Check if already authenticated in session
    const adminAuth = sessionStorage.getItem("admin_authenticated")
    if (adminAuth === "true") {
      setIsAuthenticated(true)
      loadAdminData()
    }
  }, [isAdmin, router])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Verify password with environment variable
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      sessionStorage.setItem("admin_authenticated", "true")
      toast.success("Admin access granted")
      await loadAdminData()
    } else {
      toast.error("Invalid admin password")
    }
  }

  const loadAdminData = async () => {
    setLoading(true)
    try {
      // Load admin stats
      const statsResponse = await fetch("/api/admin/stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Load users
      const usersResponse = await fetch("/api/admin/users")
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users || [])
      }
    } catch (error) {
      console.error("Failed to load admin data:", error)
      toast.error("Failed to load admin data")
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentStatus }),
      })

      if (response.ok) {
        setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, is_active: !currentStatus } : user)))
        toast.success(`User ${!currentStatus ? "activated" : "deactivated"} successfully`)
      } else {
        toast.error("Failed to update user status")
      }
    } catch (error) {
      console.error("Error toggling user status:", error)
      toast.error("Failed to update user status")
    }
  }

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <Card>
          <CardContent className="text-center py-12">
            <Lock className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">You don't have permission to access this page</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Password authentication screen
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Shield className="h-6 w-6 text-orange-500" />
              <span>Admin Access</span>
            </CardTitle>
            <CardDescription>Enter admin password to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Admin Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Access Admin Panel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-2">
              <Shield className="h-8 w-8 text-orange-500" />
              <span>Admin Dashboard</span>
            </h1>
            <p className="text-muted-foreground mt-1">Manage your EriggaLive platform</p>
          </div>
          <Badge variant="destructive" className="flex items-center space-x-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Admin Mode</span>
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">+{stats.recentSignups} this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <MessageSquare className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPosts}</div>
              <p className="text-xs text-muted-foreground">Community content</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">Online now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Coins</CardTitle>
              <Coins className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCoins.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">In circulation</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="content">Content Moderation</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{user.display_name || user.username}</p>
                            <Badge variant="secondary">{user.tier}</Badge>
                            {!user.is_active && <Badge variant="destructive">Inactive</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.coins_balance} coins • Joined {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant={user.is_active ? "destructive" : "default"}
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                        >
                          {user.is_active ? (
                            <>
                              <UserX className="h-4 w-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Moderation</CardTitle>
              <CardDescription>Review and moderate community content</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Content moderation tools coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure platform settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">System configuration tools coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
