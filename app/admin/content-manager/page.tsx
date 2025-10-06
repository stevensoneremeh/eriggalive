"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, FileText, Image, Video, Globe, Upload, Eye, EyeOff, Save, X } from "lucide-react"

const PAGES = [
  { value: "homepage", label: "Homepage", icon: "🏠" },
  { value: "about", label: "About", icon: "ℹ️" },
  { value: "events", label: "Events", icon: "🎫" },
  { value: "merch", label: "Merchandise", icon: "🛍️" },
  { value: "vault", label: "Media Vault", icon: "🎵" },
  { value: "radio", label: "Radio", icon: "📻" },
  { value: "community", label: "Community", icon: "👥" },
  { value: "chronicles", label: "Chronicles", icon: "📖" },
  { value: "coins", label: "Coins", icon: "🪙" },
  { value: "premium", label: "Premium", icon: "👑" },
  { value: "dashboard", label: "Dashboard", icon: "📊" },
  { value: "profile", label: "Profile", icon: "👤" },
  { value: "wallet", label: "Wallet", icon: "💰" },
  { value: "tickets", label: "Tickets", icon: "🎟️" },
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
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB")
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file")
      return
    }

    setUploadingImage(true)
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `content/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file)

      if (uploadError) {
        // Fallback to base64 if storage fails
        const reader = new FileReader()
        reader.onloadend = () => {
          setFormData({ ...formData, image_url: reader.result as string })
          toast.success("Image loaded (base64)")
        }
        reader.readAsDataURL(file)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      setFormData({ ...formData, image_url: publicUrl })
      toast.success("Image uploaded successfully")
    } catch (error) {
      toast.error("Failed to upload image")
    } finally {
      setUploadingImage(false)
    }
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
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {PAGES.map((page) => (
            <TabsTrigger key={page.value} value={page.value} className="flex items-center gap-2">
              <span>{page.icon}</span>
              <span className="hidden sm:inline">{page.label}</span>
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
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContent ? "Edit" : "Add"} Content Section
            </DialogTitle>
            <DialogDescription>
              {editingContent ? "Update the content section details below." : "Create a new content section for your page."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end -mt-4 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {previewMode ? "Edit Mode" : "Preview"}
            </Button>
          </div>

          {previewMode ? (
            <div className="py-4 border rounded-lg p-6 bg-muted/50">
              <div className="space-y-4">
                {formData.image_url && (
                  <img src={formData.image_url} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                )}
                {formData.title && <h2 className="text-2xl font-bold">{formData.title}</h2>}
                {formData.subtitle && <h3 className="text-xl text-muted-foreground">{formData.subtitle}</h3>}
                {formData.content_text && <p className="whitespace-pre-wrap">{formData.content_text}</p>}
                {formData.button_text && (
                  <Button>{formData.button_text}</Button>
                )}
              </div>
            </div>
          ) : (
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Page *</Label>
                    <Select value={formData.page_name} onValueChange={(value) => setFormData({ ...formData, page_name: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAGES.map((page) => (
                          <SelectItem key={page.value} value={page.value}>
                            <span className="flex items-center gap-2">
                              <span>{page.icon}</span>
                              {page.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Section Type *</Label>
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
                  <Label>Page Title (Optional)</Label>
                  <Input
                    value={formData.page_title}
                    onChange={(e) => setFormData({ ...formData, page_title: e.target.value })}
                    placeholder="e.g., Welcome to Erigga Live"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Section Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Latest Music"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Subtitle</Label>
                  <Input
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="e.g., Stream exclusive tracks"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Content Text</Label>
                  <Textarea
                    value={formData.content_text}
                    onChange={(e) => setFormData({ ...formData, content_text: e.target.value })}
                    rows={6}
                    placeholder="Enter the main content for this section..."
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.content_text.length} characters
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Button Text</Label>
                    <Input
                      value={formData.button_text}
                      onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                      placeholder="e.g., Learn More"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Button Link</Label>
                    <Input
                      value={formData.button_link}
                      onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                      placeholder="/premium"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Image Upload</Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        disabled={uploadingImage}
                        onClick={() => {
                          const input = document.querySelector('input[type="file"]') as HTMLInputElement
                          input?.click()
                        }}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Or enter image URL below (max 5MB)
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label>Image URL (Supabase, Vercel Blob, or any public URL)</Label>
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://your-blob-url.vercel-storage.com/image.jpg"
                    />
                    <p className="text-xs text-muted-foreground">
                      Supports: Vercel Blob, Supabase Storage, or any public image URL
                    </p>
                    {formData.image_url && (
                      <div className="mt-2 border rounded-lg overflow-hidden bg-muted/50">
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg'
                            toast.error("Failed to load image from URL")
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label>Video URL (YouTube, Vimeo, etc.)</Label>
                    <Input
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={formData.section_order}
                      onChange={(e) => setFormData({ ...formData, section_order: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower numbers appear first
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      id="active-switch"
                    />
                    <Label htmlFor="active-switch" className="cursor-pointer">
                      {formData.is_active ? "Active" : "Inactive"}
                    </Label>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Custom CSS (Advanced)</Label>
                  <Textarea
                    value={formData.custom_css}
                    onChange={(e) => setFormData({ ...formData, custom_css: e.target.value })}
                    rows={6}
                    placeholder=".custom-section { background: linear-gradient(...); }"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Add custom CSS to style this section uniquely
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label>Metadata (JSON)</Label>
                  <Textarea
                    value={JSON.stringify(formData.metadata, null, 2)}
                    onChange={(e) => {
                      try {
                        setFormData({ ...formData, metadata: JSON.parse(e.target.value) })
                      } catch (err) {
                        // Invalid JSON, don't update
                      }
                    }}
                    rows={4}
                    placeholder='{ "key": "value" }'
                    className="font-mono text-sm"
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              <Save className="h-4 w-4 mr-2" />
              {editingContent ? "Update" : "Add"} Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}