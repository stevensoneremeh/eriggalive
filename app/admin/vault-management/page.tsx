
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Edit, Trash2, Eye, Lock, Unlock, Music, Video, Image, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface MediaItem {
  id: string
  title: string
  description: string
  type: "video" | "audio" | "image" | "document"
  file_url: string
  thumbnail_url?: string
  tier_required: string
  is_premium: boolean
  views: number
  likes: number
  created_at: string
  category: string
}

interface AccessRule {
  id: string
  media_id: string
  tier_required: string
  is_premium: boolean
  unlock_price_coins?: number
  unlock_price_naira?: number
}

export default function VaultManagementPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null)
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    type: "video" as const,
    category: "",
    tier_required: "free",
    is_premium: false,
    unlock_price_coins: 0,
    unlock_price_naira: 0,
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadMediaItems()
  }, [])

  const loadMediaItems = async () => {
    try {
      const { data, error } = await supabase
        .from("vault_media")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading media:", error)
        return
      }

      setMediaItems(data || [])
    } catch (error) {
      console.error("Error loading media:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile || !uploadForm.title.trim()) {
      toast.error("Please provide a file and title")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("title", uploadForm.title)
      formData.append("description", uploadForm.description)
      formData.append("type", uploadForm.type)
      formData.append("category", uploadForm.category)
      formData.append("tier_required", uploadForm.tier_required)
      formData.append("is_premium", uploadForm.is_premium.toString())
      formData.append("unlock_price_coins", uploadForm.unlock_price_coins.toString())
      formData.append("unlock_price_naira", uploadForm.unlock_price_naira.toString())
      
      if (selectedThumbnail) {
        formData.append("thumbnail", selectedThumbnail)
      }

      const response = await fetch("/api/admin/vault/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      if (response.ok) {
        toast.success("Media uploaded successfully!")
        setUploadForm({
          title: "",
          description: "",
          type: "video",
          category: "",
          tier_required: "free",
          is_premium: false,
          unlock_price_coins: 0,
          unlock_price_naira: 0,
        })
        setSelectedFile(null)
        setSelectedThumbnail(null)
        loadMediaItems()
      } else {
        toast.error(result.error || "Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const updateMediaItem = async (itemId: string, updates: Partial<MediaItem>) => {
    try {
      const { error } = await supabase
        .from("vault_media")
        .update(updates)
        .eq("id", itemId)

      if (error) {
        console.error("Update error:", error)
        toast.error("Failed to update media item")
        return
      }

      toast.success("Media item updated!")
      setEditingItem(null)
      loadMediaItems()
    } catch (error) {
      console.error("Update error:", error)
      toast.error("Failed to update media item")
    }
  }

  const deleteMediaItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this media item?")) return

    try {
      const { error } = await supabase
        .from("vault_media")
        .delete()
        .eq("id", itemId)

      if (error) {
        console.error("Delete error:", error)
        toast.error("Failed to delete media item")
        return
      }

      toast.success("Media item deleted!")
      loadMediaItems()
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to delete media item")
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-4 h-4" />
      case "audio": return <Music className="w-4 h-4" />
      case "image": return <Image className="w-4 h-4" />
      case "document": return <FileText className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "free": return "bg-green-100 text-green-800"
      case "pro": return "bg-blue-100 text-blue-800"
      case "enterprise": return "bg-purple-100 text-purple-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vault Management</h2>
          <p className="text-muted-foreground">Upload and manage media content with access controls</p>
        </div>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList>
          <TabsTrigger value="upload">Upload Media</TabsTrigger>
          <TabsTrigger value="manage">Manage Content</TabsTrigger>
          <TabsTrigger value="access">Access Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload New Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    placeholder="Media title"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Media Type</Label>
                  <Select value={uploadForm.type} onValueChange={(value: any) => setUploadForm({ ...uploadForm, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                    placeholder="e.g., Music Videos, Behind Scenes"
                  />
                </div>
                <div>
                  <Label htmlFor="tier">Required Tier</Label>
                  <Select value={uploadForm.tier_required} onValueChange={(value) => setUploadForm({ ...uploadForm, tier_required: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="Media description"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="premium"
                    checked={uploadForm.is_premium}
                    onCheckedChange={(checked) => setUploadForm({ ...uploadForm, is_premium: checked })}
                  />
                  <Label htmlFor="premium">Premium Content (requires unlock)</Label>
                </div>

                {uploadForm.is_premium && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <div>
                      <Label htmlFor="coins">Unlock Price (Coins)</Label>
                      <Input
                        id="coins"
                        type="number"
                        value={uploadForm.unlock_price_coins}
                        onChange={(e) => setUploadForm({ ...uploadForm, unlock_price_coins: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="naira">Unlock Price (₦)</Label>
                      <Input
                        id="naira"
                        type="number"
                        value={uploadForm.unlock_price_naira}
                        onChange={(e) => setUploadForm({ ...uploadForm, unlock_price_naira: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="file">Media File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept="video/*,audio/*,image/*,.pdf,.doc,.docx"
                />
              </div>

              <div>
                <Label htmlFor="thumbnail">Thumbnail (optional)</Label>
                <Input
                  id="thumbnail"
                  type="file"
                  onChange={(e) => setSelectedThumbnail(e.target.files?.[0] || null)}
                  accept="image/*"
                />
              </div>

              <Button onClick={handleFileUpload} disabled={uploading} className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Media"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <div className="grid gap-4">
            {mediaItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeIcon(item.type)}
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <Badge className={getTierColor(item.tier_required)}>
                          {item.tier_required}
                        </Badge>
                        {item.is_premium && (
                          <Badge variant="secondary">
                            <Lock className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-muted-foreground mb-2">{item.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {item.views} views
                        </span>
                        <span>Category: {item.category}</span>
                        <span>Created {new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setEditingItem(item)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => deleteMediaItem(item.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {mediaItems.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No media uploaded yet</h3>
                <p className="text-muted-foreground">Upload your first media item to get started</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Access Control Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <h4 className="font-semibold text-green-600 mb-2">Free Tier</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Basic content access</li>
                      <li>• Limited premium unlocks</li>
                      <li>• Standard video quality</li>
                    </ul>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-semibold text-blue-600 mb-2">Pro Tier</h4>
                    <ul className="text-sm space-y-1">
                      <li>• All free content</li>
                      <li>• More premium unlocks</li>
                      <li>• HD video quality</li>
                      <li>• Early access to content</li>
                    </ul>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-semibold text-purple-600 mb-2">Enterprise Tier</h4>
                    <ul className="text-sm space-y-1">
                      <li>• All content access</li>
                      <li>• Unlimited premium unlocks</li>
                      <li>• 4K video quality</li>
                      <li>• Exclusive content</li>
                    </ul>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
