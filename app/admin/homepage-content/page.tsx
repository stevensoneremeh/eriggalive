"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, FileText } from "lucide-react"

export default function HomepageContentPage() {
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    image_url: "",
    section_type: "hero",
  })

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const response = await fetch("/api/admin/homepage")
      const data = await response.json()
      setContent(data.content || [])
    } catch (error) {
      toast.error("Failed to load homepage content")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/admin/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error("Failed to save")
      toast.success("Homepage content saved")
      fetchContent()
      setFormData({ title: "", body: "", image_url: "", section_type: "hero" })
    } catch (error) {
      toast.error("Failed to save homepage content")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Homepage Management</h1>
        <p className="text-muted-foreground">Manage homepage content sections</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Add Content Section
          </CardTitle>
          <CardDescription>Create new homepage content</CardDescription>
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
              <Label htmlFor="body">Content</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="section_type">Section Type</Label>
              <Select
                value={formData.section_type}
                onValueChange={(value) => setFormData({ ...formData, section_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero">Hero</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="about">About</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Content</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : content.length === 0 ? (
            <p className="text-muted-foreground">No content yet</p>
          ) : (
            <div className="space-y-4">
              {content.map((item: any) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.section_type}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
