"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Music, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

interface CreatePostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: string
}

export function CreatePostDialog({ open, onOpenChange, defaultTab = "post" }: CreatePostDialogProps) {
  const [content, setContent] = useState("")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { profile } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (type: string) => {
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter some content for your post",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Post created!",
        description: "Your post has been shared with the community",
      })

      setContent("")
      setMediaFile(null)
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Failed to create post",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMediaFile(file)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={defaultTab === "bars" ? "bars" : "post"} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="post">General Post</TabsTrigger>
            <TabsTrigger value="bars">Submit Bars</TabsTrigger>
          </TabsList>

          <TabsContent value="post" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">What's on your mind?</Label>
              <Textarea
                id="content"
                placeholder="Share your thoughts with the Erigga community..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="media">Add Media (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="media"
                  type="file"
                  accept="image/*,audio/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button variant="outline" onClick={() => document.getElementById("media")?.click()} className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  {mediaFile ? mediaFile.name : "Choose File"}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleSubmit("post")}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-orange-500 to-lime-500 hover:from-orange-600 hover:to-lime-600 text-white"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Share Post
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="bars" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bars-content">Your Bars</Label>
              <Textarea
                id="bars-content"
                placeholder="Drop your hottest bars here... Show the community what you've got!"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] font-mono"
              />
              <p className="text-xs text-muted-foreground">Tip: Write your bars line by line for better formatting</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audio">Add Audio Recording (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input id="audio" type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
                <Button variant="outline" onClick={() => document.getElementById("audio")?.click()} className="flex-1">
                  <Music className="h-4 w-4 mr-2" />
                  {mediaFile ? mediaFile.name : "Upload Audio"}
                </Button>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-medium mb-2">Bars Competition Rules:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Original content only</li>
                <li>• Community votes with Erigga Coins</li>
                <li>• Top bars earn rewards weekly</li>
                <li>• Keep it respectful and creative</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleSubmit("bars")}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-orange-500 to-lime-500 hover:from-orange-600 hover:to-lime-600 text-white"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Bars
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
