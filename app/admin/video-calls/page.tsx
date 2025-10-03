
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Video, Phone, Calendar, Users, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface VideoCall {
  id: string
  user_id: string
  user: {
    display_name: string
    email: string
  }
  scheduled_at: string
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  daily_room_url?: string
  daily_room_name?: string
  duration: number
  created_at: string
}

export default function AdminVideoCallsPage() {
  const [calls, setCalls] = useState<VideoCall[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "scheduled" | "completed">("all")
  const supabase = createClient()

  useEffect(() => {
    loadCalls()
    const cleanup = setupRealtimeSubscription()
    return cleanup
  }, [])

  const loadCalls = async () => {
    try {
      const { data, error } = await supabase
        .from("meet_greet_bookings")
        .select(`
          *,
          user:users!inner(display_name, email)
        `)
        .order("scheduled_at", { ascending: true })

      if (error) {
        console.error("Error loading calls:", error)
        return
      }

      setCalls(data || [])
    } catch (error) {
      console.error("Error loading calls:", error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("video-calls-admin")
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "meet_greet_bookings" 
      }, (payload) => {
        console.log("Realtime update:", payload)
        loadCalls()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const startCall = async (callId: string) => {
    try {
      const response = await fetch(`/api/admin/video-calls/${callId}/start`, {
        method: "POST",
      })

      const result = await response.json()
      if (response.ok) {
        toast.success("Video call started!")
        // Open Daily.co room in new window
        window.open(result.room_url, "_blank", "width=1200,height=800")
        loadCalls()
      } else {
        toast.error(result.error || "Failed to start call")
      }
    } catch (error) {
      console.error("Error starting call:", error)
      toast.error("Failed to start call")
    }
  }

  const endCall = async (callId: string) => {
    try {
      const response = await fetch(`/api/admin/video-calls/${callId}/end`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Video call ended!")
        loadCalls()
      } else {
        const result = await response.json()
        toast.error(result.error || "Failed to end call")
      }
    } catch (error) {
      console.error("Error ending call:", error)
      toast.error("Failed to end call")
    }
  }

  const filteredCalls = calls.filter((call) => {
    if (filter === "all") return true
    if (filter === "scheduled") return call.status === "scheduled"
    if (filter === "completed") return call.status === "completed"
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
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
          <h2 className="text-2xl font-bold">Video Call Management</h2>
          <p className="text-muted-foreground">Manage meet & greet video calls with fans</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All Calls
          </Button>
          <Button
            variant={filter === "scheduled" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("scheduled")}
          >
            Scheduled
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("completed")}
          >
            Completed
          </Button>
        </div>
      </div>

      {/* Call Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Calls</p>
                <p className="text-2xl font-bold">{calls.length}</p>
              </div>
              <Video className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">{calls.filter(c => c.status === "scheduled").length}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{calls.filter(c => c.status === "in_progress").length}</p>
              </div>
              <Phone className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{calls.filter(c => c.status === "completed").length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calls List */}
      <div className="grid gap-4">
        {filteredCalls.map((call) => (
          <Card key={call.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{call.user.display_name}</h3>
                    <Badge className={getStatusColor(call.status)}>
                      {call.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{call.user.email}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(call.scheduled_at).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {call.duration} minutes
                    </div>
                  </div>
                  {call.notes && (
                    <div className="mt-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                      <strong>Notes:</strong> {call.notes}
                    </div>
                  )}
                  {call.daily_room_url && (
                    <div className="mt-2">
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Room Active: {call.daily_room_name}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {call.status === "scheduled" && (
                    <Button onClick={() => startCall(call.id)} size="sm">
                      <Video className="w-4 h-4 mr-2" />
                      Start Call
                    </Button>
                  )}
                  {call.status === "in_progress" && (
                    <Button onClick={() => endCall(call.id)} variant="destructive" size="sm">
                      <Phone className="w-4 h-4 mr-2" />
                      End Call
                    </Button>
                  )}
                  {call.daily_room_url && (
                    <Button
                      onClick={() => window.open(call.daily_room_url, "_blank")}
                      variant="outline"
                      size="sm"
                    >
                      Join Room
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCalls.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No video calls found</h3>
            <p className="text-muted-foreground">
              {filter === "all" ? "No video calls scheduled yet" : `No ${filter} calls found`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
