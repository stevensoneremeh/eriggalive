"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Shield, Users, MessageSquare, BarChart3, Settings, Plus, Edit, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Category {
  id: number
  name: string
  slug: string
  icon: string
  color: string
  description: string
  is_active: boolean
  display_order: number
  created_at: string
}

interface AdminStats {
  totalUsers: number
  totalPosts: number
  totalCategories: number
  activeUsers: number
}

export default function AdminPage() {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalCategories: 0,
    activeUsers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // New category form
  const [newCategory, setNewCategory] = useState({
    name: "",
    slug: "",
    icon: "💬",
    color: "#6B7280",
    description: "",
  })

  useEffect(() => {
    if (!isLoading) {
      if (!user || !profile) {
        router.push("/login")
        return
      }

      // Check if user is admin
      if (profile.role !== "admin" && user.email !== "admin@eriggalive.com") {
        router.push("/dashboard")
        toast.error("Access denied. Admin privileges required.")
        return
      }

      loadData()
    }
  }, [user, profile, isLoading, router])

  const loadData = async () => {
    try {
      await Promise.all([loadCategories(), loadStats()])
    } catch (error) {
      console.error("Error loading admin data:", error)
      toast.error("Failed to load admin data")
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/community/categories")
      const data = await response.json()

      if (data.success) {
        setCategories(data.categories)
      } else {
        console.error("Error loading categories:", data.error)
      }
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error loading stats:", error)
      // Set default stats
      setStats({
        totalUsers: 0,
        totalPosts: 0,
        totalCategories: categories.length,
        activeUsers: 0,
      })
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim() || !newCategory.slug.trim()) {
      toast.error("Name and slug are required")
      return
    }

    setCreating(true)

    try {
      const response = await fetch("/api/community/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCategory),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Category created successfully!")
        setNewCategory({
          name: "",
          slug: "",
          icon: "💬",
          color: "#6B7280",
          description: "",
        })
        loadCategories()
      } else {
        toast.error(result.error || "Failed to create category")
      }
    } catch (error) {
      console.error("Error creating category:", error)
      toast.error("Failed to create category")
    } finally {
      setCreating(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleNameChange = (name: string) => {
    setNewCategory({
      ...newCategory,
      name,
      slug: generateSlug(name),
    })
  }

  if (isLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!user || !profile || (profile.role !== "admin" && user.email !== "admin@eriggalive.com")) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-muted-foreground mb-6">You need admin privileges to access this page.</p>
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">Manage your Erigga Live platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registered members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Community posts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Settings className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Active categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Create Category</span>
                </CardTitle>
                <CardDescription>Add a new community category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    placeholder="Category name"
                    value={newCategory.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Slug</label>
                  <Input
                    placeholder="category-slug"
                    value={newCategory.slug}
                    onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Icon</label>
                    <Input
                      placeholder="💬"
                      value={newCategory.icon}
                      onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Color</label>
                    <Input
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Category description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  />
                </div>

                <Button onClick={handleCreateCategory} disabled={creating} className="w-full">
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Category
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Categories List */}
            <Card>
              <CardHeader>
                <CardTitle>Existing Categories</CardTitle>
                <CardDescription>Manage community categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{category.icon}</span>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">/{category.slug}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={category.is_active ? "default" : "secondary"}
                          style={{ backgroundColor: category.is_active ? category.color : undefined }}
                        >
                          {category.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {categories.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No categories found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage platform users and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>User management features coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Management</CardTitle>
              <CardDescription>Moderate posts, comments, and other content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Content management features coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Configure platform-wide settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Platform settings coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
