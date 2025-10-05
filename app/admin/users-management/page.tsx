"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Users as UsersIcon, Pencil } from "lucide-react"

export default function UsersManagementPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ tier: "", role: "", is_active: true })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users-management")
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    try {
      const response = await fetch("/api/admin/users-management", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editingUser.id, updates: formData }),
      })
      if (!response.ok) throw new Error("Update failed")
      toast.success("User updated successfully")
      setIsDialogOpen(false)
      fetchUsers()
    } catch (error) {
      toast.error("Failed to update user")
    }
  }

  const openEditDialog = (user: any) => {
    setEditingUser(user)
    setFormData({
      tier: user.tier || "grassroot",
      role: user.role || "user",
      is_active: user.is_active !== false,
    })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Manage platform users and their access levels</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UsersIcon className="mr-2 h-5 w-5" />
            All Users
          </CardTitle>
          <CardDescription>View and manage all registered users</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.display_name || "-"}</TableCell>
                    <TableCell>
                      <span className="capitalize">{user.tier || "grassroot"}</span>
                    </TableCell>
                    <TableCell>{user.role || "user"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        user.is_active !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {user.is_active !== false ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tier</Label>
              <Select value={formData.tier} onValueChange={(value) => setFormData({ ...formData, tier: value })}>
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
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select 
                value={formData.is_active ? "active" : "inactive"} 
                onValueChange={(value) => setFormData({ ...formData, is_active: value === "active" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate}>Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
