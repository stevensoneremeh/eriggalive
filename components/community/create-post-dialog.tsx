"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, ImageIcon, Music, Type, Coins } from "lucide-react"
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
  const [activeTab, setActiveTab] = useState(defaultTab === "bars" ? "bar" : "post")

  const { profile } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async () => {
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
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Success!",
        description: `Your ${activeTab} has been posted successfully`,
      })

      // Reset form
      setContent("")
      setMediaFile(null)
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setMediaFile(file)
    }
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
              Submit Bar
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
              />

              <div className="flex items-center gap-2 mt-4">
                <input
                  type="file"
                  accept="image/*,audio/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="media-upload"
                />
                <label htmlFor="media-upload">
                  <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Add Media
                    </span>
                  </Button>
                </label>
                {mediaFile && (
                  <Badge variant="secondary">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    {mediaFile.name}
                  </Badge>
                )}
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
                placeholder="Drop your bars here... Make it fire! 🔥"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] resize-none bg-background"
              />

              <div className="flex items-center gap-2 mt-4">
                <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" id="audio-upload" />
                <label htmlFor="audio-upload">
                  <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                    <span>
                      <Music className="h-4 w-4 mr-2" />
                      Add Audio
                    </span>
                  </Button>
                </label>
                {mediaFile && (
                  <Badge variant="secondary">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    {mediaFile.name}
                  </Badge>
                )}
              </div>

              <div className="mt-4 p-3 bg-background rounded-md border">
                <p className="text-sm font-medium mb-1">How Bar Voting Works:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Fans vote on bars using 5 Erigga Coins per vote</li>
                  <li>• You earn coins based on the votes you receive</li>
                  <li>• Top bars of the week get featured in the community</li>
                </ul>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">{content.length}/500 characters</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              className="bg-gradient-to-r from-orange-500 to-lime-500 hover:from-orange-600 hover:to-lime-600 text-white"
            >
              {isSubmitting ? "Posting..." : `Post ${activeTab === "bar" ? "Bar" : "Content"}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
