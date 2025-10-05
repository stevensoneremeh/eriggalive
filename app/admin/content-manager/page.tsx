
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, FileText, Image, Video, Globe } from "lucide-react"

const PAGES = [
  { value: "homepage", label: "Homepage" },
  { value: "about", label: "About" },
  { value: "events", label: "Events" },
  { value: "merch", label: "Merchandise" },
  { value: "vault", label: "Media Vault" },
  { value: "radio", label: "Radio" },
  { value: "community", label: "Community" },
  { value: "chronicles", label: "Chronicles" },
  { value: "coins", label: "Coins" },
  { value: "premium", label: "Premium" },
]

const SECTION_TYPES = [
  { value: "hero", label: "Hero Section" },
  { value: "featured", label: "Featured Content" },
  { value: "about", label: "About Section" },
  { value: "services", label: "Services" },
  { value: "gallery", label: "Gallery" },
  { value: "cta", label: "Call to Action" },
  { value: "testimonials", label: "Testimonials" },
  { value: "faq", label: "FAQ" },
  { value: "custom", label: "Custom Section" },
]

export default function ContentManagerPage() {
  const [pages, setPages] = useState([])
  const [content, setContent] = useState([])
  const [selectedPage, setSelectedPage] = useState("homepage")
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContent, setEditingContent] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    page_name: "homepage",
    page_title: "",
    section_type: "hero",
    title: "",
    subtitle: "",
    content_text: "",
    image_url: "",
    video_url: "",
    button_text: "",
    button_link: "",
    section_order: 0,
    is_active: true,
    custom_css: "",
    metadata: {},
  })

  useEffect(() => {
    fetchPages()
  }, [])

  useEffect(() => {
    if (selectedPage) {
      fetchContent(selectedPage)
    }
  }, [selectedPage])

  const fetchPages = async () => {
    try {
      const response = await fetch("/api/admin/content")
      const data = await response.json()
      setPages(data.pages || [])
    } catch (error) {
      toast.error("Failed to load pages")
    }
  }

  const fetchContent = async (page: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/content?page=${page}`)
      const data = await response.json()
      setContent(data.content || [])
    } catch (error) {
      toast.error("Failed to load content")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const url = "/api/admin/content"
      const method = editingContent ? "PATCH" : "POST"
      const body = editingContent ? { id: editingContent.id, ...formData } : formData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      
      if (!response.ok) throw new Error("Failed to save")
      
      toast.success(editingContent ? "Content updated" : "Content added")
      setIsDialogOpen(false)
      resetForm()
      fetchContent(selectedPage)
    } catch (error) {
      toast.error("Failed to save content")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this content?")) return
    
    try {
      const response = await fetch(`/api/admin/content?id=${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete")
      
      toast.success("Content deleted")
      fetchContent(selectedPage)
    } catch (error) {
      toast.error("Failed to delete content")
    }
  }

  const openEditDialog = (item: any) => {
    setEditingContent(item)
    setFormData({
      page_name: item.page_name,
      page_title: item.page_title,
      section_type: item.section_type,
      title: item.title || "",
      subtitle: item.subtitle || "",
      content_text: item.content_text || "",
      image_url: item.image_url || "",
      video_url: item.video_url || "",
      button_text: item.button_text || "",
      button_link: item.button_link || "",
      section_order: item.section_order || 0,
      is_active: item.is_active,
      custom_css: item.custom_css || "",
      metadata: item.metadata || {},
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingContent(null)
    setFormData({
      page_name: selectedPage,
      page_title: "",
      section_type: "hero",
      title: "",
      subtitle: "",
      content_text: "",
      image_url: "",
      video_url: "",
      button_text: "",
      button_link: "",
      section_order: 0,
      is_active: true,
      custom_css: "",
      metadata: {},
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Manager</h1>
          <p className="text-muted-foreground">Manage content for all pages across your website</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Content
        </Button>
      </div>

      <Tabs value={selectedPage} onValueChange={setSelectedPage}>
        <TabsList className="grid grid-cols-5 lg:grid-cols-10 gap-2">
          {PAGES.map((page) => (
            <TabsTrigger key={page.value} value={page.value}>
              {page.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {PAGES.map((page) => (
          <TabsContent key={page.value} value={page.value}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5" />
                  {page.label} Content
                </CardTitle>
                <CardDescription>Manage content sections for the {page.label} page</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : content.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No content added for this page yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Section Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {content.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.section_order}</TableCell>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell className="capitalize">{item.section_type}</TableCell>
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
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContent ? "Edit" : "Add"} Content Section</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Page</Label>
                <Select value={formData.page_name} onValueChange={(value) => setFormData({ ...formData, page_name: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAGES.map((page) => (
                      <SelectItem key={page.value} value={page.value}>{page.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Section Type</Label>
                <Select value={formData.section_type} onValueChange={(value) => setFormData({ ...formData, section_type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>

            <div className="grid gap-2">
              <Label>Subtitle</Label>
              <Input value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} />
            </div>

            <div className="grid gap-2">
              <Label>Content Text</Label>
              <Textarea value={formData.content_text} onChange={(e) => setFormData({ ...formData, content_text: e.target.value })} rows={4} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Image URL</Label>
                <Input value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Video URL</Label>
                <Input value={formData.video_url} onChange={(e) => setFormData({ ...formData, video_url: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Button Text</Label>
                <Input value={formData.button_text} onChange={(e) => setFormData({ ...formData, button_text: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Button Link</Label>
                <Input value={formData.button_link} onChange={(e) => setFormData({ ...formData, button_link: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Display Order</Label>
                <Input type="number" value={formData.section_order} onChange={(e) => setFormData({ ...formData, section_order: parseInt(e.target.value) })} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                <Label>Active</Label>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Custom CSS (optional)</Label>
              <Textarea value={formData.custom_css} onChange={(e) => setFormData({ ...formData, custom_css: e.target.value })} rows={3} placeholder=".custom-class { color: red; }" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingContent ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
