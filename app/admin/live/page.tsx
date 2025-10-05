
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Video, Play, Square, Users, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface LiveStream {
  id: string
  title: string
  description: string
  mux_playback_id?: string
  mux_stream_key?: string
  is_live: boolean
  viewer_count: number
  created_at: string
}

export default function AdminLivePage() {
  const [streams, setStreams] = useState<LiveStream[]>([])
  const [currentStream, setCurrentStream] = useState<LiveStream | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  })
  const supabase = createClient()

  useEffect(() => {
    loadStreams()
    setupRealtimeSubscription()
  }, [])

  const loadStreams = async () => {
    const { data, error } = await supabase
      .from("live_streams")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading streams:", error)
      return
    }

    setStreams(data || [])
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("live-streams")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_streams" }, (payload: any) => {
        if (payload.eventType === "INSERT") {
          setStreams((prev) => [payload.new as LiveStream, ...prev])
        } else if (payload.eventType === "UPDATE") {
          setStreams((prev) => prev.map((stream) => 
            stream.id === payload.new.id ? { ...stream, ...payload.new } : stream
          ))
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }

  const createStream = async () => {
    if (!formData.title.trim()) {
      toast.error("Stream title is required")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/admin/live/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      if (response.ok) {
        toast.success("Live stream created successfully!")
        setFormData({ title: "", description: "" })
        loadStreams()
      } else {
        toast.error(result.error || "Failed to create stream")
      }
    } catch (error) {
      console.error("Error creating stream:", error)
      toast.error("Failed to create stream")
    } finally {
      setIsCreating(false)
    }
  }

  const startStream = async (streamId: string) => {
    try {
      const response = await fetch(`/api/admin/live/${streamId}/start`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Stream started!")
        loadStreams()
      } else {
        const result = await response.json()
        toast.error(result.error || "Failed to start stream")
      }
    } catch (error) {
      console.error("Error starting stream:", error)
      toast.error("Failed to start stream")
    }
  }

  const stopStream = async (streamId: string) => {
    try {
      const response = await fetch(`/api/admin/live/${streamId}/stop`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Stream stopped!")
        loadStreams()
      } else {
        const result = await response.json()
        toast.error(result.error || "Failed to stop stream")
      }
    } catch (error) {
      console.error("Error stopping stream:", error)
      toast.error("Failed to stop stream")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Streaming Management</h2>
          <p className="text-muted-foreground">Create and manage live video streams</p>
        </div>
      </div>

      {/* Create Stream Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Live Stream</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Stream Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter stream title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Stream description (optional)"
                rows={3}
              />
            </div>
          </div>
          <Button onClick={createStream} disabled={isCreating} className="w-full md:w-auto">
            <Video className="w-4 h-4 mr-2" />
            {isCreating ? "Creating..." : "Create Stream"}
          </Button>
        </CardContent>
      </Card>

      {/* Active Streams */}
      <div className="grid gap-4">
        {streams.map((stream) => (
          <Card key={stream.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{stream.title}</h3>
                    <Badge variant={stream.is_live ? "destructive" : "secondary"}>
                      {stream.is_live ? "LIVE" : "OFFLINE"}
                    </Badge>
                  </div>
                  {stream.description && (
                    <p className="text-muted-foreground mb-2">{stream.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {stream.viewer_count} viewers
                    </div>
                    <span>Created {new Date(stream.created_at).toLocaleDateString()}</span>
                  </div>
                  {stream.mux_stream_key && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                      <strong>Stream Key:</strong> {stream.mux_stream_key}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {stream.is_live ? (
                    <Button
                      onClick={() => stopStream(stream.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop Stream
                    </Button>
                  ) : (
                    <Button
                      onClick={() => startStream(stream.id)}
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Stream
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {streams.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No streams yet</h3>
            <p className="text-muted-foreground">Create your first live stream to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
