"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Shield, Pencil, Trash2 } from "lucide-react"

export default function VaultItemsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    media_type: "video",
    media_url: "",
    thumbnail_url: "",
    category: "vault",
    tier_required: "",
  })

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/admin/vault-items")
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      toast.error("Failed to load vault items")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const url = "/api/admin/vault-items"
      const method = editingItem ? "PATCH" : "POST"
      const body = editingItem ? { id: editingItem.id, ...formData } : formData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error("Failed to save")
      toast.success(editingItem ? "Item updated" : "Item created")
      setIsDialogOpen(false)
      resetForm()
      fetchItems()
    } catch (error) {
      toast.error("Failed to save item")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return
    try {
      const response = await fetch(`/api/admin/vault-items?id=${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete")
      toast.success("Item deleted")
      fetchItems()
    } catch (error) {
      toast.error("Failed to delete item")
    }
  }

  const openEditDialog = (item: any) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description || "",
      media_type: item.media_type,
      media_url: item.media_url,
      thumbnail_url: item.thumbnail_url || "",
      category: item.category || "vault",
      tier_required: item.tier_required || "",
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingItem(null)
    setFormData({
      title: "",
      description: "",
      media_type: "video",
      media_url: "",
      thumbnail_url: "",
      category: "vault",
      tier_required: "",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vault Management</h1>
          <p className="text-muted-foreground">Manage vault content and tier access</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Vault Items
          </CardTitle>
          <CardDescription>Manage exclusive content with tier-based access</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tier Required</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell className="capitalize">{item.media_type}</TableCell>
                    <TableCell className="capitalize">{item.category}</TableCell>
                    <TableCell className="capitalize">{item.tier_required || "Free"}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit" : "Add"} Vault Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Media Type</Label>
                <Select value={formData.media_type} onValueChange={(value) => setFormData({ ...formData, media_type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vault">Vault</SelectItem>
                    <SelectItem value="chronicles">Chronicles</SelectItem>
                    <SelectItem value="exclusive">Exclusive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Media URL</Label>
              <Input value={formData.media_url} onChange={(e) => setFormData({ ...formData, media_url: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label>Thumbnail URL</Label>
              <Input value={formData.thumbnail_url} onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Tier Required</Label>
              <Select value={formData.tier_required} onValueChange={(value) => setFormData({ ...formData, tier_required: value })}>
                <SelectTrigger><SelectValue placeholder="No restriction" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No restriction</SelectItem>
                  <SelectItem value="pioneer">Pioneer</SelectItem>
                  <SelectItem value="elder">Elder</SelectItem>
                  <SelectItem value="blood">Blood</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingItem ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
