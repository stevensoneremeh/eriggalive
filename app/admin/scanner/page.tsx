"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Scan,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Calendar,
  Activity,
  TrendingUp,
  Eye,
} from "lucide-react"
import { QRScanner } from "@/components/tickets/qr-scanner"
import { createClient } from "@/lib/supabase/client"

interface Event {
  id: string
  title: string
  event_date: string
  venue: string
  max_capacity: number
  current_attendance: number
  status: string
}

interface ScanStats {
  total_scans: number
  valid_scans: number
  invalid_scans: number
  already_used: number
  wrong_event: number
  expired: number
}

interface RecentScan {
  id: string
  ticket_number: string
  holder_name: string
  scan_result: string
  created_at: string
  ticket_type: string
}

export default function AdminScannerPage() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [scanStats, setScanStats] = useState<ScanStats>({
    total_scans: 0,
    valid_scans: 0,
    invalid_scans: 0,
    already_used: 0,
    wrong_event: 0,
    expired: 0,
  })
  const [recentScans, setRecentScans] = useState<RecentScan[]>([])
  const [loading, setLoading] = useState(true)
  const [scanLocation, setScanLocation] = useState("Main Entrance")
  const supabase = createClient()

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .in("status", ["upcoming", "live"])
          .order("event_date", { ascending: true })

        if (error) throw error
        setEvents(data || [])

        // Auto-select first event if available
        if (data && data.length > 0) {
          setSelectedEvent(data[0])
        }
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [supabase])

  // Fetch scan statistics for selected event
  useEffect(() => {
    if (!selectedEvent) return

    const fetchScanStats = async () => {
      try {
        const { data, error } = await supabase.from("scan_logs").select("scan_result").eq("event_id", selectedEvent.id)

        if (error) throw error

        const stats = {
          total_scans: data?.length || 0,
          valid_scans: data?.filter((s) => s.scan_result === "valid").length || 0,
          invalid_scans: data?.filter((s) => s.scan_result === "invalid").length || 0,
          already_used: data?.filter((s) => s.scan_result === "already_used").length || 0,
          wrong_event: data?.filter((s) => s.scan_result === "wrong_event").length || 0,
          expired: data?.filter((s) => s.scan_result === "expired").length || 0,
        }

        setScanStats(stats)
      } catch (error) {
        console.error("Error fetching scan stats:", error)
      }
    }

    fetchScanStats()
  }, [selectedEvent, supabase])

  // Fetch recent scans
  useEffect(() => {
    if (!selectedEvent) return

    const fetchRecentScans = async () => {
      try {
        const { data, error } = await supabase
          .from("scan_logs")
          .select(
            `
            id,
            scan_result,
            created_at,
            tickets (
              ticket_number,
              ticket_type,
              profiles (
                full_name
              )
            )
          `,
          )
          .eq("event_id", selectedEvent.id)
          .order("created_at", { ascending: false })
          .limit(10)

        if (error) throw error

        const formattedScans = data?.map((scan: any) => ({
          id: scan.id,
          ticket_number: scan.tickets?.ticket_number || "Unknown",
          holder_name: scan.tickets?.profiles?.full_name || "Unknown",
          scan_result: scan.scan_result,
          created_at: scan.created_at,
          ticket_type: scan.tickets?.ticket_type || "Unknown",
        }))

        setRecentScans(formattedScans || [])
      } catch (error) {
        console.error("Error fetching recent scans:", error)
      }
    }

    fetchRecentScans()
  }, [selectedEvent, supabase])

  const handleScanResult = (result: any) => {
    // Refresh stats and recent scans after each scan
    if (selectedEvent) {
      // Update stats
      setScanStats((prev) => ({
        ...prev,
        total_scans: prev.total_scans + 1,
        [result.result]: prev[result.result as keyof ScanStats] + 1,
      }))

      // Add to recent scans if successful
      if (result.success && result.ticket) {
        const newScan: RecentScan = {
          id: Date.now().toString(),
          ticket_number: result.ticket.ticket_number,
          holder_name: result.ticket.holder_name,
          scan_result: result.result,
          created_at: new Date().toISOString(),
          ticket_type: result.ticket.ticket_type,
        }
        setRecentScans((prev) => [newScan, ...prev.slice(0, 9)])
      }
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

  const getResultIcon = (result: string) => {
    switch (result) {
      case "valid":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "already_used":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case "invalid":
      case "expired":
      case "wrong_event":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case "valid":
        return "bg-green-100 text-green-800"
      case "already_used":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-red-100 text-red-800"
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Scan className="h-8 w-8" />
            Ticket Scanner
          </h1>
          <p className="text-muted-foreground">Scan and validate event tickets</p>
        </div>
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Event Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Event</label>
              <Select
                value={selectedEvent?.id || ""}
                onValueChange={(value) => {
                  const event = events.find((e) => e.id === value)
                  setSelectedEvent(event || null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an event to scan for" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Scan Location</label>
              <Select value={scanLocation} onValueChange={setScanLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Main Entrance">Main Entrance</SelectItem>
                  <SelectItem value="VIP Entrance">VIP Entrance</SelectItem>
                  <SelectItem value="Side Entrance">Side Entrance</SelectItem>
                  <SelectItem value="Backstage">Backstage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedEvent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>{formatDate(selectedEvent.event_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>{selectedEvent.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>
                    {selectedEvent.current_attendance}/{selectedEvent.max_capacity} attended
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {selectedEvent && (
        <Tabs defaultValue="scanner" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scanner">Scanner</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="recent">Recent Scans</TabsTrigger>
          </TabsList>

          <TabsContent value="scanner">
            <QRScanner eventId={selectedEvent.id} scanLocation={scanLocation} onScanResult={handleScanResult} />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Activity className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{scanStats.total_scans}</div>
                  <div className="text-xs text-muted-foreground">Total Scans</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{scanStats.valid_scans}</div>
                  <div className="text-xs text-muted-foreground">Valid</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-600">{scanStats.already_used}</div>
                  <div className="text-xs text-muted-foreground">Already Used</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">{scanStats.invalid_scans}</div>
                  <div className="text-xs text-muted-foreground">Invalid</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-600">{scanStats.expired}</div>
                  <div className="text-xs text-muted-foreground">Expired</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">
                    {scanStats.total_scans > 0 ? Math.round((scanStats.valid_scans / scanStats.total_scans) * 100) : 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                </CardContent>
              </Card>
            </div>

            {/* Event Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Event Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Current Attendance</span>
                    <span className="font-medium">
                      {selectedEvent.current_attendance} / {selectedEvent.max_capacity}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((selectedEvent.current_attendance / selectedEvent.max_capacity) * 100, 100)}%`,
                      }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round((selectedEvent.current_attendance / selectedEvent.max_capacity) * 100)}% capacity
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Recent Scans
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentScans.length > 0 ? (
                  <div className="space-y-3">
                    {recentScans.map((scan) => (
                      <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getResultIcon(scan.scan_result)}
                          <div>
                            <p className="font-medium">{scan.holder_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {scan.ticket_number} • {scan.ticket_type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getResultColor(scan.scan_result)}>
                            {scan.scan_result.replace("_", " ")}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(scan.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No scans yet for this event</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!selectedEvent && events.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Events</h3>
            <p className="text-muted-foreground">There are no upcoming or live events available for scanning.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
