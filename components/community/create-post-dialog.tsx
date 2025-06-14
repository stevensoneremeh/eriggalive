"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, ImageIcon, Music, Type, Coins, X, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { useContentManager } from "@/lib/content-manager"

interface CreatePostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: string
  onPostCreated?: () => void
}

export function CreatePostDialog({ open, onOpenChange, defaultTab = "post", onPostCreated }: CreatePostDialogProps) {
  const [content, setContent] = useState("")
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeTab, setActiveTab] = useState(defaultTab === "bars" ? "bar" : "post")

  const { profile } = useAuth()
  const { toast } = useToast()
  const contentManager = useContentManager()

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter some content for your post",
        variant: "destructive",
      })
      return
    }

    if (!profile?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create posts",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      const mediaUrls: string[] = []
      const mediaTypes: string[] = []

      // Upload media files if any
      if (mediaFiles.length > 0) {
        setUploadProgress(10)

        for (let i = 0; i < mediaFiles.length; i++) {
          const file = mediaFiles[i]
          const { success, url, error } = await contentManager.uploadMedia(file, profile.id)

          if (success && url) {
            mediaUrls.push(url)
            mediaTypes.push(
              file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : "video",
            )
          } else {
            throw new Error(error || `Failed to upload ${file.name}`)
          }

          setUploadProgress(10 + ((i + 1) * 40) / mediaFiles.length)
        }
      }

      setUploadProgress(60)

      // Create the post
      const { success, post, error } = await contentManager.createPost(profile.id, {
        content,
        type: activeTab === "bar" ? "bars" : "post",
        media_urls: mediaUrls,
        media_types: mediaTypes,
        tags: [],
        mentions: [],
        hashtags: [],
      })

      setUploadProgress(90)

      if (!success) {
        throw new Error(error || "Failed to create post")
      }

      setUploadProgress(100)

      toast({
        title: "Success!",
        description: `Your ${activeTab === "bar" ? "bars" : "post"} has been shared with the community`,
      })

      // Reset form
      setContent("")
      setMediaFiles([])
      setUploadProgress(0)
      onOpenChange(false)

      // Notify parent to refresh
      onPostCreated?.()
    } catch (error) {
      console.error("Post creation error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      const isValidType =
        file.type.startsWith("image/") || file.type.startsWith("audio/") || file.type.startsWith("video/")
      const isValidSize = file.size <= 50 * 1024 * 1024 // 50MB limit

      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported media type`,
          variant: "destructive",
        })
        return false
      }

      if (!isValidSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 50MB limit`,
          variant: "destructive",
        })
        return false
      }

      return true
    })

    setMediaFiles((prev) => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (file.type.startsWith("audio/")) return <Music className="h-4 w-4" />
    return <Upload className="h-4 w-4" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Create New Content
            {profile && (
              <Badge variant="secondary" className="ml-auto">
                <Coins className="h-3 w-3 mr-1" />
                {profile.coins?.toLocaleString() || 0}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="post" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Regular Post
            </TabsTrigger>
            <TabsTrigger value="bar" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Submit Bars
            </TabsTrigger>
          </TabsList>

          <TabsContent value="post" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Share with the Community</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Share your thoughts, experiences, or anything Erigga-related with fellow fans.
              </p>

              <Textarea
                placeholder="What's on your mind? Share your thoughts about Erigga, music, or anything else..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={500}
              />

              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">{content.length}/500 characters</span>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="bar" className="space-y-4">
            <Card className="p-4 bg-gradient-to-r from-orange-50 to-lime-50 dark:from-orange-950/20 dark:to-lime-950/20 border-orange-200">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Music className="h-5 w-5 text-orange-500" />
                Submit Your Bars
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drop your best bars inspired by Erigga! Other fans can vote with coins, and you'll earn coins based on
                votes.
              </p>

              <Textarea
                placeholder="Drop your bars here... Make it fire! 🔥&#10;&#10;Example:&#10;Money no be everything but everything need money&#10;Erigga taught me that the hustle never funny"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] resize-none bg-background font-mono"
                maxLength={500}
              />

              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">{content.length}/500 characters</span>
              </div>

              <div className="mt-4 p-3 bg-background rounded-md border">
                <p className="text-sm font-medium mb-1">How Bar Voting Works:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Fans vote on bars using Erigga Coins (minimum 5 coins per vote)</li>
                  <li>• You earn coins directly from votes as rewards</li>
                  <li>• Top bars get featured in the community</li>
                  <li>• Quality bars can earn you hundreds of coins!</li>
                </ul>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Media Upload Section */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Add Media (Optional)</h4>
            <Badge variant="secondary" className="text-xs">
              Max 50MB per file
            </Badge>
          </div>

          <div className="space-y-3">
            <input
              type="file"
              accept="image/*,audio/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
              id="media-upload"
              multiple
            />
            <label htmlFor="media-upload">
              <Button variant="outline" size="sm" className="cursor-pointer w-full" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </span>
              </Button>
            </label>

            {/* Selected Files */}
            {mediaFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected files:</p>
                {mediaFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file)}
                      <span className="text-sm truncate">{file.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {(file.size / 1024 / 1024).toFixed(1)}MB
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)} className="h-6 w-6 p-0">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Upload Progress */}
        {isSubmitting && uploadProgress > 0 && (
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {uploadProgress < 60
                    ? "Uploading media..."
                    : uploadProgress < 90
                      ? "Creating post..."
                      : "Finalizing..."}
                </span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {activeTab === "bar" ? "Bars can earn you coins from votes!" : "Share your thoughts with the community"}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              className="bg-gradient-to-r from-orange-500 to-lime-500 hover:from-orange-600 hover:to-lime-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadProgress < 60 ? "Uploading..." : "Posting..."}
                </>
              ) : (
                `Post ${activeTab === "bar" ? "Bars" : "Content"}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
