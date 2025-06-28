"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Package,
  Gift,
  Music,
  Video,
  MessageSquare,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Shield,
  AlertTriangle,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { FreebieItem } from "@/types/freebies"

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalPosts: number
  totalProducts: number
  totalFreebies: number
  totalRevenue: number
  pendingOrders: number
  pendingClaims: number
}

interface User {
  id: number
  username: string
  email: string
  tier: string
  role: string
  is_active: boolean
  created_at: string
  last_login?: string
}

interface Product {
  id: number
  name: string
  price: number
  stock_quantity: number
  category: string
  is_active: boolean
  is_premium_only: boolean
  required_tier?: string
}

export default function AdminDashboard() {
  const { profile } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalProducts: 0,
    totalFreebies: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    pendingClaims: 0,
  })
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [freebies, setFreebies] = useState<FreebieItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState("overview")

  // Form states
  const [freebieForm, setFreebieForm] = useState({
    name: "",
    description: "",
    category: "",
    required_tier: "grassroot",
    stock_quantity: 0,
    max_per_user: 1,
    is_active: true,
    is_featured: false,
    requires_shipping: true,
    expires_at: "",
    images: [] as string[],
  })
  const [editingFreebie, setEditingFreebie] = useState<FreebieItem | null>(null)
  const [freebieDialogOpen, setFreebieDialogOpen] = useState(false)

  useEffect(() => {
    // Check admin access
    if (!profile) return

    if (!["admin", "super_admin"].includes(profile.role)) {
      toast.error("Access denied. Admin privileges required.")
      router.push("/dashboard")
      return
    }

    fetchAdminData()
  }, [profile, router])

  const fetchAdminData = async () => {
    try {
      setLoading(true)

      // Fetch stats, users, products, and freebies in parallel
      const [statsRes, usersRes, productsRes, freebiesRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/products"),
        fetch("/api/admin/freebies"),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users)
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.products)
      }

      if (freebiesRes.ok) {
        const freebiesData = await freebiesRes.json()
        setFreebies(freebiesData.freebies)
      }
    } catch (error) {
      console.error("Error fetching admin data:", error)
      toast.error("Failed to load admin data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFreebie = async () => {
    try {
      const response = await fetch("/api/admin/freebies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...freebieForm,
          slug: freebieForm.name.toLowerCase().replace(/\s+/g, "-"),
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Freebie created successfully!")
        setFreebieDialogOpen(false)
        setFreebieForm({
          name: "",
          description: "",
          category: "",
          required_tier: "grassroot",
          stock_quantity: 0,
          max_per_user: 1,
          is_active: true,
          is_featured: false,
          requires_shipping: true,
          expires_at: "",
          images: [],
        })
        fetchAdminData()
      } else {
        toast.error(data.error || "Failed to create freebie")
      }
    } catch (error) {
      console.error("Error creating freebie:", error)
      toast.error("Failed to create freebie")
    }
  }

  const handleUpdateFreebie = async () => {
    if (!editingFreebie) return

    try {
      const response = await fetch(`/api/admin/freebies/${editingFreebie.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(freebieForm),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Freebie updated successfully!")
        setFreebieDialogOpen(false)
        setEditingFreebie(null)
        fetchAdminData()
      } else {
        toast.error(data.error || "Failed to update freebie")
      }
    } catch (error) {
      console.error("Error updating freebie:", error)
      toast.error("Failed to update freebie")
    }
  }

  const handleDeleteFreebie = async (id: number) => {
    if (!confirm("Are you sure you want to delete this freebie?")) return

    try {
      const response = await fetch(`/api/admin/freebies/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Freebie deleted successfully!")
        fetchAdminData()
      } else {
        toast.error(data.error || "Failed to delete freebie")
      }
    } catch (error) {
      console.error("Error deleting freebie:", error)
      toast.error("Failed to delete freebie")
    }
  }

  const openEditDialog = (freebie: FreebieItem) => {
    setEditingFreebie(freebie)
    setFreebieForm({
      name: freebie.name,
      description: freebie.description || "",
      category: freebie.category,
      required_tier: freebie.required_tier,
      stock_quantity: freebie.stock_quantity,
      max_per_user: freebie.max_per_user,
      is_active: freebie.is_active,
      is_featured: freebie.is_featured,
      requires_shipping: freebie.requires_shipping,
      expires_at: freebie.expires_at || "",
      images: freebie.images,
    })
    setFreebieDialogOpen(true)
  }

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="font-street text-4xl md:text-6xl text-gradient mb-2">ADMIN DASHBOARD</h1>
            <p className="text-muted-foreground">Manage your Erigga Live platform</p>
          </div>
          <Badge variant="outline" className="w-fit">
            <Shield className="h-4 w-4 mr-2" />
            {profile.role.toUpperCase()}
          </Badge>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-5 bg-card/50 border border-orange-500/20 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="freebies">Freebies</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">{stats.activeUsers} active users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Community Posts</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPosts}</div>
                  <p className="text-xs text-muted-foreground">Community engagement</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">{stats.pendingOrders} pending orders</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Freebies</CardTitle>
                  <Gift className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalFreebies}</div>
                  <p className="text-xs text-muted-foreground">{stats.pendingClaims} pending claims</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Media Content</CardTitle>
                  <Music className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">156</div>
                  <p className="text-xs text-muted-foreground">Tracks & videos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Status</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Healthy</div>
                  <p className="text-xs text-muted-foreground">All systems operational</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">Require attention</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button onClick={() => setSelectedTab("freebies")} className="h-20 flex-col">
                    <Gift className="h-6 w-6 mb-2" />
                    Add Freebie
                  </Button>
                  <Button onClick={() => setSelectedTab("products")} variant="outline" className="h-20 flex-col">
                    <Package className="h-6 w-6 mb-2" />
                    Manage Products
                  </Button>
                  <Button onClick={() => setSelectedTab("users")} variant="outline" className="h-20 flex-col">
                    <Users className="h-6 w-6 mb-2" />
                    View Users
                  </Button>
                  <Button onClick={() => setSelectedTab("content")} variant="outline" className="h-20 flex-col">
                    <Music className="h-6 w-6 mb-2" />
                    Content Manager
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {user.tier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? "default" : "destructive"}>
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Product Management</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Tier Access</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>₦{product.price.toLocaleString()}</TableCell>
                        <TableCell>{product.stock_quantity}</TableCell>
                        <TableCell className="capitalize">{product.category}</TableCell>
                        <TableCell>
                          {product.is_premium_only ? (
                            <Badge variant="outline">{product.required_tier?.toUpperCase()}+</Badge>
                          ) : (
                            <Badge variant="secondary">All Tiers</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.is_active ? "default" : "destructive"}>
                            {product.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Freebies Tab */}
          <TabsContent value="freebies">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Freebies Management</CardTitle>
                <Dialog open={freebieDialogOpen} onOpenChange={setFreebieDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingFreebie(null)
                        setFreebieForm({
                          name: "",
                          description: "",
                          category: "",
                          required_tier: "grassroot",
                          stock_quantity: 0,
                          max_per_user: 1,
                          is_active: true,
                          is_featured: false,
                          requires_shipping: true,
                          expires_at: "",
                          images: [],
                        })
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Freebie
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingFreebie ? "Edit Freebie" : "Create New Freebie"}</DialogTitle>
                      <DialogDescription>
                        {editingFreebie ? "Update the freebie details" : "Add a new free item for users to claim"}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={freebieForm.name}
                          onChange={(e) => setFreebieForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Freebie name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={freebieForm.category}
                          onValueChange={(value) => setFreebieForm((prev) => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="clothing">Clothing</SelectItem>
                            <SelectItem value="accessories">Accessories</SelectItem>
                            <SelectItem value="collectibles">Collectibles</SelectItem>
                            <SelectItem value="digital">Digital</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="required_tier">Required Tier</Label>
                        <Select
                          value={freebieForm.required_tier}
                          onValueChange={(value) => setFreebieForm((prev) => ({ ...prev, required_tier: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grassroot">Grassroot</SelectItem>
                            <SelectItem value="pioneer">Pioneer</SelectItem>
                            <SelectItem value="elder">Elder</SelectItem>
                            <SelectItem value="blood">Blood</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stock_quantity">Stock Quantity</Label>
                        <Input
                          id="stock_quantity"
                          type="number"
                          value={freebieForm.stock_quantity}
                          onChange={(e) =>
                            setFreebieForm((prev) => ({
                              ...prev,
                              stock_quantity: Number.parseInt(e.target.value) || 0,
                            }))
                          }
                          placeholder="Available quantity"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="max_per_user">Max Per User</Label>
                        <Input
                          id="max_per_user"
                          type="number"
                          value={freebieForm.max_per_user}
                          onChange={(e) =>
                            setFreebieForm((prev) => ({ ...prev, max_per_user: Number.parseInt(e.target.value) || 1 }))
                          }
                          placeholder="Max claims per user"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="expires_at">Expiry Date (Optional)</Label>
                        <Input
                          id="expires_at"
                          type="date"
                          value={freebieForm.expires_at}
                          onChange={(e) => setFreebieForm((prev) => ({ ...prev, expires_at: e.target.value }))}
                        />
                      </div>

                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={freebieForm.description}
                          onChange={(e) => setFreebieForm((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe the freebie"
                          rows={3}
                        />
                      </div>

                      <div className="col-span-2 space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is_active"
                            checked={freebieForm.is_active}
                            onCheckedChange={(checked) => setFreebieForm((prev) => ({ ...prev, is_active: checked }))}
                          />
                          <Label htmlFor="is_active">Active</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is_featured"
                            checked={freebieForm.is_featured}
                            onCheckedChange={(checked) => setFreebieForm((prev) => ({ ...prev, is_featured: checked }))}
                          />
                          <Label htmlFor="is_featured">Featured</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="requires_shipping"
                            checked={freebieForm.requires_shipping}
                            onCheckedChange={(checked) =>
                              setFreebieForm((prev) => ({ ...prev, requires_shipping: checked }))
                            }
                          />
                          <Label htmlFor="requires_shipping">Requires Shipping</Label>
                        </div>
                      </div>

                      <div className="col-span-2 flex gap-4 pt-4">
                        <Button
                          className="flex-1"
                          onClick={editingFreebie ? handleUpdateFreebie : handleCreateFreebie}
                          disabled={!freebieForm.name || !freebieForm.category}
                        >
                          {editingFreebie ? "Update Freebie" : "Create Freebie"}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => setFreebieDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Required Tier</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Claims</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {freebies.map((freebie) => (
                      <TableRow key={freebie.id}>
                        <TableCell className="font-medium">{freebie.name}</TableCell>
                        <TableCell className="capitalize">{freebie.category}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{freebie.required_tier.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>{freebie.stock_quantity}</TableCell>
                        <TableCell>{freebie.total_claims}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Badge variant={freebie.is_active ? "default" : "destructive"}>
                              {freebie.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {freebie.is_featured && <Badge variant="secondary">Featured</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditDialog(freebie)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteFreebie(freebie.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Music Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Tracks</span>
                      <Badge>124</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Albums</span>
                      <Badge>12</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Premium Content</span>
                      <Badge variant="outline">45</Badge>
                    </div>
                    <Button className="w-full" asChild>
                      <a href="/admin/upload">Manage Content</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Video Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Music Videos</span>
                      <Badge>32</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Behind Scenes</span>
                      <Badge>18</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Live Performances</span>
                      <Badge variant="outline">8</Badge>
                    </div>
                    <Button className="w-full bg-transparent" variant="outline">
                      Manage Videos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
