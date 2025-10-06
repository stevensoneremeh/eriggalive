"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Video, VideoOff, Loader2, ExternalLink } from "lucide-react"

export default function VideoCallsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [startingCall, setStartingCall] = useState<string | null>(null)
  const [endingCall, setEndingCall] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchBookings()

    // Set up real-time subscription
    const channel = supabase
      .channel('video-calls-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'meet_greet_bookings' 
      }, () => {
        fetchBookings()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("meet_greet_bookings")
        .select("*")
        .order("scheduled_at", { ascending: true })

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      toast.error("Failed to load bookings")
    } finally {
      setLoading(false)
    }
  }

  const startCall = async (bookingId: string) => {
    setStartingCall(bookingId)
    try {
      const response = await fetch(`/api/admin/video-calls/${bookingId}/start`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Failed to start call")

      toast.success("Call started! Opening room...")

      // Open the room in a new window
      if (data.room_url) {
        window.open(data.room_url, "_blank")
      }

      fetchBookings()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setStartingCall(null)
    }
  }

  const endCall = async (bookingId: string) => {
    setEndingCall(bookingId)
    try {
      const response = await fetch(`/api/admin/video-calls/${bookingId}/end`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Failed to end call")

      toast.success("Call ended successfully")
      fetchBookings()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setEndingCall(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      pending: { variant: "secondary", label: "Pending Payment" },
      scheduled: { variant: "default", label: "Scheduled" },
      in_progress: { variant: "destructive", label: "In Progress" },
      completed: { variant: "outline", label: "Completed" },
      cancelled: { variant: "outline", label: "Cancelled" },
    }

    const config = statusConfig[status] || statusConfig.pending
    return <Badge variant={config.variant as any}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Video Call Management</h1>
        <p className="text-muted-foreground">Manage meet & greet video call sessions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Calls</CardTitle>
          <CardDescription>Start and manage video calls with fans</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No bookings found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      {new Date(booking.scheduled_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.user_name}</div>
                        <div className="text-sm text-muted-foreground">{booking.user_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{booking.duration} min</TableCell>
                    <TableCell>₦{booking.payment_amount?.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>
                      <Badge variant={booking.payment_status === "completed" ? "default" : "secondary"}>
                        {booking.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {booking.status === "scheduled" && booking.payment_status === "completed" && (
                          <Button
                            size="sm"
                            onClick={() => startCall(booking.id)}
                            disabled={startingCall === booking.id}
                          >
                            {startingCall === booking.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Video className="h-4 w-4" />
                            )}
                          </Button>
                        )}

                        {booking.status === "in_progress" && booking.daily_room_url && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(booking.daily_room_url, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => endCall(booking.id)}
                              disabled={endingCall === booking.id}
                            >
                              {endingCall === booking.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <VideoOff className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}