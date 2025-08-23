"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QRScanner } from "@/components/admin/qr-scanner"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Calendar, MapPin, RefreshCw, CheckCircle, Clock, AlertCircle } from "lucide-react"

interface Event {
  id: string
  title: string
  event_date: string
  venue: string
  max_capacity: number
  tickets_sold: number
  status: string
}

interface CheckinStats {
  total_tickets: number
  checked_in: number
  attendance_rate: number
  remaining_capacity: number
}

interface ScanResult {
  success: boolean
  message: string
  ticket?: any
  event?: any
  attendee?: any
}

export default function AdminScannerPage() {
  const { profile } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [checkinStats, setCheckinStats] = useState<CheckinStats | null>(null)
  const [recentScans, setRecentScans] = useState<ScanResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/admin/events")
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
        if (data.events?.length > 0 && !selectedEventId) {
          setSelectedEventId(data.events[0].id)
        }
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    }
  }

  const fetchCheckinStats = async (eventId: string) => {
    if (!eventId) return

    try {
      const response = await fetch(`/api/admin/events/${eventId}/checkins`)
      if (response.ok) {
        const data = await response.json()
        setCheckinStats(data.statistics)
      }
    } catch (error) {
      console.error("Failed to fetch checkin stats:", error)
    }
  }

  const handleScanSuccess = (result: ScanResult) => {
    setRecentScans((prev) => [result, ...prev.slice(0, 9)]) // Keep last 10 scans
    if (result.success && selectedEventId) {
      fetchCheckinStats(selectedEventId)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchEvents()
      setIsLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (selectedEventId) {
      fetchCheckinStats(selectedEventId)
    }
  }, [selectedEventId])

  if (!profile || profile.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-white">Access Denied</h2>
            <p className="text-slate-400">Admin access required to use the scanner interface.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-900 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Event Scanner</h1>
                <p className="text-slate-400">Scan tickets and manage event check-ins</p>
              </div>
              <Button
                onClick={() => {
                  fetchEvents()
                  if (selectedEventId) fetchCheckinStats(selectedEventId)
                }}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </motion.div>

          {/* Event Selection */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Select Event</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Choose an event to scan tickets for" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id} className="text-white hover:bg-slate-700">
                        <div className="flex items-center justify-between w-full">
                          <span>{event.title}</span>
                          <Badge variant="outline" className="ml-2">
                            {event.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedEvent && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(selectedEvent.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedEvent.venue}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Users className="w-4 h-4" />
                      <span>
                        {selectedEvent.tickets_sold}/{selectedEvent.max_capacity} tickets
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scanner */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <QRScanner eventId={selectedEventId} onScanSuccess={handleScanSuccess} />
            </motion.div>

            {/* Stats and Recent Scans */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {/* Check-in Stats */}
              {checkinStats && (
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Check-in Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{checkinStats.checked_in}</div>
                        <div className="text-xs text-slate-400">Checked In</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{checkinStats.total_tickets}</div>
                        <div className="text-xs text-slate-400">Total Tickets</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">{checkinStats.attendance_rate}%</div>
                        <div className="text-xs text-slate-400">Attendance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-400">{checkinStats.remaining_capacity}</div>
                        <div className="text-xs text-slate-400">Remaining</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Scans */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Scans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentScans.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-4">No scans yet</p>
                    ) : (
                      recentScans.map((scan, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            scan.success ? "border-green-500/20 bg-green-500/10" : "border-red-500/20 bg-red-500/10"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {scan.success ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-400" />
                              )}
                              <span className="text-sm font-medium text-white">
                                {scan.success ? scan.attendee?.email : "Scan Failed"}
                              </span>
                            </div>
                            <Clock className="w-3 h-3 text-slate-400" />
                          </div>
                          {scan.success && scan.ticket && (
                            <p className="text-xs text-slate-400 mt-1">#{scan.ticket.ticket_number}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
