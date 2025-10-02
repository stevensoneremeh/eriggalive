"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Video } from "lucide-react"

export default function VideosManagementPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    category: "chronicles",
    tier_required: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error("Failed to save")
      toast.success("Video added successfully")
      setFormData({ title: "", description: "", url: "", category: "chronicles", tier_required: "" })
    } catch (error) {
      toast.error("Failed to add video")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chronicles & Vault Management</h1>
        <p className="text-muted-foreground">Manage video content</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="mr-2 h-5 w-5" />
            Add Video
          </CardTitle>
          <CardDescription>Add a new video to Chronicles or Vault</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">Video URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chronicles">Chronicles</SelectItem>
                  <SelectItem value="vault">Vault</SelectItem>
                  <SelectItem value="exclusive">Exclusive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tier_required">Tier Required (optional)</Label>
              <Select
                value={formData.tier_required}
                onValueChange={(value) => setFormData({ ...formData, tier_required: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No restriction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No restriction</SelectItem>
                  <SelectItem value="pioneer">Pioneer</SelectItem>
                  <SelectItem value="elder">Elder</SelectItem>
                  <SelectItem value="blood">Blood</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Add Video
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
