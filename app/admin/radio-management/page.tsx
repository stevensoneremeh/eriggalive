"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Plus, Radio } from "lucide-react"

export default function RadioManagementPage() {
  const [streams, setStreams] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: "",
    stream_url: "",
    schedule: "",
    description: "",
  })

  useEffect(() => {
    fetchStreams()
  }, [])

  const fetchStreams = async () => {
    try {
      const response = await fetch("/api/admin/radio-streams")
      const data = await response.json()
      setStreams(data.streams || [])
    } catch (error) {
      toast.error("Failed to load radio streams")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/admin/radio-streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error("Failed to save")
      toast.success("Radio stream saved")
      fetchStreams()
      setFormData({ title: "", stream_url: "", schedule: "", description: "" })
    } catch (error) {
      toast.error("Failed to save radio stream")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Radio Management</h1>
        <p className="text-muted-foreground">Manage live radio streams</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Radio className="mr-2 h-5 w-5" />
            Add Radio Stream
          </CardTitle>
          <CardDescription>Configure a new radio stream</CardDescription>
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
              <Label htmlFor="stream_url">Stream URL</Label>
              <Input
                id="stream_url"
                type="url"
                value={formData.stream_url}
                onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="schedule">Schedule</Label>
              <Input
                id="schedule"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                placeholder="e.g., Mon-Fri 6pm-9pm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Add Stream
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Radio Streams</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : streams.length === 0 ? (
            <p className="text-muted-foreground">No streams configured</p>
          ) : (
            <div className="space-y-4">
              {streams.map((stream: any) => (
                <div key={stream.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{stream.title}</h3>
                  <p className="text-sm text-muted-foreground">{stream.schedule}</p>
                  <p className="text-xs text-muted-foreground mt-2">{stream.stream_url}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
