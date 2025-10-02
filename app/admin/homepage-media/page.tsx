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
import { Plus, FileImage, Pencil, Trash2 } from "lucide-react"

export default function HomepageMediaPage() {
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMedia, setEditingMedia] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    media_type: "image",
    media_url: "",
    thumbnail_url: "",
    section: "hero",
    caption: "",
    link_url: "",
  })

  useEffect(() => {
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    try {
      const response = await fetch("/api/admin/homepage-media")
      const data = await response.json()
      setMedia(data.media || [])
    } catch (error) {
      toast.error("Failed to load media")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const url = "/api/admin/homepage-media"
      const method = editingMedia ? "PATCH" : "POST"
      const body = editingMedia ? { id: editingMedia.id, ...formData } : formData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error("Failed to save")
      toast.success(editingMedia ? "Media updated" : "Media added")
      setIsDialogOpen(false)
      resetForm()
      fetchMedia()
    } catch (error) {
      toast.error("Failed to save media")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this media?")) return
    try {
      const response = await fetch(`/api/admin/homepage-media?id=${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete")
      toast.success("Media deleted")
      fetchMedia()
    } catch (error) {
      toast.error("Failed to delete media")
    }
  }

  const openEditDialog = (item: any) => {
    setEditingMedia(item)
    setFormData({
      title: item.title,
      media_type: item.media_type,
      media_url: item.media_url,
      thumbnail_url: item.thumbnail_url || "",
      section: item.section || "hero",
      caption: item.caption || "",
      link_url: item.link_url || "",
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingMedia(null)
    setFormData({
      title: "",
      media_type: "image",
      media_url: "",
      thumbnail_url: "",
      section: "hero",
      caption: "",
      link_url: "",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Homepage Media</h1>
          <p className="text-muted-foreground">Manage hero section photos and videos</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Media
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileImage className="mr-2 h-5 w-5" />
            Hero Section Media
          </CardTitle>
          <CardDescription>Manage images and videos for the homepage</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : media.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No media added</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {media.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="capitalize">{item.media_type}</TableCell>
                    <TableCell className="capitalize">{item.section}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        item.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
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
            <DialogTitle>{editingMedia ? "Edit" : "Add"} Homepage Media</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Media Type</Label>
                <Select value={formData.media_type} onValueChange={(value) => setFormData({ ...formData, media_type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Section</Label>
                <Select value={formData.section} onValueChange={(value) => setFormData({ ...formData, section: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Hero</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Media URL</Label>
              <Input value={formData.media_url} onChange={(e) => setFormData({ ...formData, media_url: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label>Thumbnail URL (for videos)</Label>
              <Input value={formData.thumbnail_url} onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Caption</Label>
              <Input value={formData.caption} onChange={(e) => setFormData({ ...formData, caption: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Link URL (optional)</Label>
              <Input value={formData.link_url} onChange={(e) => setFormData({ ...formData, link_url: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingMedia ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
