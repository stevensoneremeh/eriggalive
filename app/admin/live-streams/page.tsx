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
import { Plus, Radio, PlayCircle, StopCircle, Copy } from "lucide-react"

export default function LiveStreamsPage() {
  const [streams, setStreams] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    stream_type: "audio",
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
    try {
      const response = await fetch("/api/admin/live-streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error("Failed to create")
      toast.success("Stream created")
      setIsDialogOpen(false)
      setFormData({ title: "", description: "", stream_type: "audio" })
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Streams (Mux)</h1>
          <p className="text-muted-foreground">Manage audio and video live streams</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Stream
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Radio className="mr-2 h-5 w-5" />
            Active Streams
          </CardTitle>
          <CardDescription>Manage Mux live streaming for audio and video</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : streams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No streams created</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stream Key</TableHead>
                  <TableHead>Playback ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {streams.map((stream: any) => (
                  <TableRow key={stream.id}>
                    <TableCell className="font-medium">{stream.title}</TableCell>
                    <TableCell className="capitalize">{stream.stream_type}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        stream.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {stream.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {stream.mux_stream_key ? (
                        <div className="flex items-center gap-2">
                          <code className="text-xs">{stream.mux_stream_key.substring(0, 20)}...</code>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(stream.mux_stream_key)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not configured</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {stream.mux_playback_id ? (
                        <div className="flex items-center gap-2">
                          <code className="text-xs">{stream.mux_playback_id}</code>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(stream.mux_playback_id)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not configured</span>
                      )}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!process.env.NEXT_PUBLIC_MUX_CONFIGURED && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Mux credentials not configured. Add MUX_TOKEN_ID and MUX_TOKEN_SECRET to environment variables to enable full streaming features.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Live Stream</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>Stream Type</Label>
              <Select value={formData.stream_type} onValueChange={(value) => setFormData({ ...formData, stream_type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="audio">Audio Only</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
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
