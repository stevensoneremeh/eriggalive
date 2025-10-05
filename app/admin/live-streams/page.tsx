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
import { Plus, Radio, PlayCircle, StopCircle, Video, Trash2 } from "lucide-react"

export default function LiveStreamsPage() {
  const [streams, setStreams] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_url: "",
    stream_type: "video",
    thumbnail_url: "",
  })

  useEffect(() => {
    fetchStreams()
  }, [])

  const fetchStreams = async () => {
    try {
      const response = await fetch("/api/admin/live-streams")
      const data = await response.json()
      setStreams(data.streams || [])
    } catch (error) {
      toast.error("Failed to load streams")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a title")
      return
    }
    if (!formData.video_url.trim()) {
      toast.error("Please enter a video URL")
      return
    }

    try {
      const response = await fetch("/api/admin/live-streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error("Failed to create")
      toast.success("Live stream created successfully")
      setIsDialogOpen(false)
      setFormData({ title: "", description: "", video_url: "", stream_type: "video", thumbnail_url: "" })
      fetchStreams()
    } catch (error) {
      toast.error("Failed to create stream")
    }
  }

  const toggleStream = async (stream: any) => {
    try {
      const newStatus = stream.status === "active" ? "idle" : "active"
      const response = await fetch("/api/admin/live-streams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: stream.id,
          status: newStatus,
          is_active: newStatus === "active",
          actual_start: newStatus === "active" ? new Date().toISOString() : stream.actual_start,
          actual_end: newStatus === "idle" ? new Date().toISOString() : null,
        }),
      })
      if (!response.ok) throw new Error("Failed to toggle")
      toast.success(`Stream ${newStatus === "active" ? "started" : "stopped"}`)
      fetchStreams()
    } catch (error) {
      toast.error("Failed to toggle stream")
    }
  }

  const deleteStream = async (streamId: string) => {
    if (!confirm("Are you sure you want to delete this stream?")) return
    
    try {
      const response = await fetch("/api/admin/live-streams", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: streamId }),
      })
      if (!response.ok) throw new Error("Failed to delete")
      toast.success("Stream deleted successfully")
      fetchStreams()
    } catch (error) {
      toast.error("Failed to delete stream")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Video Streams</h1>
          <p className="text-muted-foreground">Manage video live streams for the radio page</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Stream
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="mr-2 h-5 w-5" />
            Active Streams
          </CardTitle>
          <CardDescription>Manage live video streaming with direct video URLs</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : streams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No streams created yet. Create your first stream to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Video URL</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {streams.map((stream: any) => (
                  <TableRow key={stream.id}>
                    <TableCell className="font-medium">{stream.title}</TableCell>
                    <TableCell className="capitalize">{stream.stream_type || "video"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        stream.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {stream.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {stream.video_url ? (
                        <code className="text-xs">{stream.video_url.substring(0, 40)}...</code>
                      ) : (
                        <span className="text-muted-foreground text-xs">No URL</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant={stream.status === "active" ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleStream(stream)}
                        >
                          {stream.status === "active" ? (
                            <><StopCircle className="mr-2 h-4 w-4" />Stop</>
                          ) : (
                            <><PlayCircle className="mr-2 h-4 w-4" />Start</>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteStream(stream.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            <strong>How it works:</strong> Create a stream with a video URL (mp4, webm, or m3u8), then start it to make it live. 
            The video will appear on the radio page and in a mini player on other pages.
          </p>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Live Stream</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                placeholder="e.g., Erigga Live Session"
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                placeholder="Brief description of the stream..."
                rows={3} 
              />
            </div>
            <div className="grid gap-2">
              <Label>Video URL *</Label>
              <Input 
                value={formData.video_url} 
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })} 
                placeholder="https://example.com/video.mp4 or .m3u8"
                required 
              />
              <p className="text-xs text-muted-foreground">
                Supports: MP4, WebM, M3U8 (HLS streams)
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Thumbnail URL (optional)</Label>
              <Input 
                value={formData.thumbnail_url} 
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })} 
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>
            <div className="grid gap-2">
              <Label>Stream Type</Label>
              <Select value={formData.stream_type} onValueChange={(value) => setFormData({ ...formData, stream_type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Stream</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
