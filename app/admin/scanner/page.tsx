
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { QRScanner } from "@/components/tickets/qr-scanner"
import { 
  Scan, 
  Users, 
  DollarSign, 
  Ticket, 
  CheckCircle, 
  XCircle,
  Clock,
  MapPin,
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface TicketDetails {
  id: string
  ticket_number: string
  ticket_type: string
  price_paid_naira: number
  custom_amount: number | null
  seating_assignment: string | null
  seating_priority: number
  admission_status: string
  status: string
  admitted_at: string | null
  admitted_by: string | null
  purchased_at: string
  user: {
    full_name: string
    email: string
  }
  event: {
    title: string
    event_date: string
    venue: string
  }
}

interface EventStats {
  total_tickets: number
  total_admitted: number
  total_revenue: number
  average_payment: number
  vip_count: number
  regular_count: number
}

export default function AdminScannerPage() {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>("")
  const [tickets, setTickets] = useState<TicketDetails[]>([])
  const [stats, setStats] = useState<EventStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      fetchEventTickets()
    }
  }, [selectedEvent])

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("status", "upcoming")
        .order("event_date", { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error("Error fetching events:", error)
      toast.error("Failed to load events")
    } finally {
      setLoading(false)
    }
  }

  const fetchEventTickets = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          ),
          events:event_id (
            title,
            event_date,
            venue
          )
        `)
        .eq("event_id", selectedEvent)
        .order("seating_priority", { ascending: false })

      if (error) throw error

      const ticketsData = (data || []).map(ticket => ({
        ...ticket,
        user: ticket.profiles,
        event: ticket.events
      }))

      setTickets(ticketsData)
      calculateStats(ticketsData)
    } catch (error) {
      console.error("Error fetching tickets:", error)
      toast.error("Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (ticketsData: any[]) => {
    const stats: EventStats = {
      total_tickets: ticketsData.length,
      total_admitted: ticketsData.filter(t => t.admission_status === "admitted").length,
      total_revenue: ticketsData.reduce((sum, t) => 
        sum + (t.custom_amount || t.price_paid_naira || 0), 0
      ),
      average_payment: 0,
      vip_count: ticketsData.filter(t => t.seating_priority >= 800).length,
      regular_count: ticketsData.filter(t => t.seating_priority < 800).length,
    }

    stats.average_payment = stats.total_tickets > 0 
      ? stats.total_revenue / stats.total_tickets 
      : 0

    setStats(stats)
  }

  const handleScanResult = (result: any) => {
    if (result.success) {
      fetchEventTickets() // Refresh the list
      toast.success("Ticket validated successfully!")
    }
  }

  const exportTickets = () => {
    const csv = [
      ["Ticket Number", "Holder Name", "Email", "Amount Paid", "Seating", "Priority", "Status", "Admitted At"],
      ...tickets.map(t => [
        t.ticket_number,
        t.user?.full_name || "N/A",
        t.user?.email || "N/A",
        `₦${((t.custom_amount || t.price_paid_naira || 0) / 100).toLocaleString()}`,
        t.seating_assignment || "Pending",
        t.seating_priority,
        t.admission_status,
        t.admitted_at ? new Date(t.admitted_at).toLocaleString() : "Not admitted"
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `event-tickets-${selectedEvent}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredTickets = tickets.filter(ticket => 
    ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "admitted":
        return "bg-green-500 text-white"
      case "pending":
        return "bg-yellow-500 text-white"
      case "denied":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 900) return "text-purple-600 font-bold"
    if (priority >= 800) return "text-blue-600 font-semibold"
    if (priority >= 700) return "text-green-600"
    return "text-gray-600"
  }

  if (loading && events.length === 0) {
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
          <h1 className="text-3xl font-bold">Event Scanner & Management</h1>
          <p className="text-muted-foreground">Scan tickets and view attendee details</p>
        </div>
        <Button onClick={() => setShowScanner(true)}>
          <Scan className="h-4 w-4 mr-2" />
          Open Scanner
        </Button>
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Event</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an event to manage" />
            </SelectTrigger>
            <SelectContent>
              {events.map(event => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title} - {new Date(event.event_date).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEvent && stats && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tickets</p>
                    <p className="text-2xl font-bold">{stats.total_tickets}</p>
                  </div>
                  <Ticket className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Admitted</p>
                    <p className="text-2xl font-bold">{stats.total_admitted}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {Math.round((stats.total_admitted / stats.total_tickets) * 100)}% checked in
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      ₦{(stats.total_revenue / 100).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Avg: ₦{(stats.average_payment / 100).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">VIP / Regular</p>
                    <p className="text-2xl font-bold">
                      {stats.vip_count} / {stats.regular_count}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tickets Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Attendee Details</CardTitle>
                <div className="flex items-center gap-4">
                  <Input
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                  <Button variant="outline" size="sm" onClick={exportTickets}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Holder</TableHead>
                    <TableHead>Amount Paid</TableHead>
                    <TableHead>Seating</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Admitted At</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <>
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-sm">
                          {ticket.ticket_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{ticket.user?.full_name}</div>
                            <div className="text-xs text-muted-foreground">{ticket.user?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            ₦{((ticket.custom_amount || ticket.price_paid_naira || 0) / 100).toLocaleString()}
                          </div>
                          {ticket.custom_amount && (
                            <Badge variant="outline" className="text-xs">Custom</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{ticket.seating_assignment || "Pending"}</div>
                        </TableCell>
                        <TableCell>
                          <span className={getPriorityColor(ticket.seating_priority)}>
                            {ticket.seating_priority}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(ticket.admission_status)}>
                            {ticket.admission_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ticket.admitted_at ? (
                            <div className="text-sm">
                              {new Date(ticket.admitted_at).toLocaleString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedTicket(
                              expandedTicket === ticket.id ? null : ticket.id
                            )}
                          >
                            {expandedTicket === ticket.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedTicket === ticket.id && (
                        <TableRow>
                          <TableCell colSpan={8}>
                            <div className="p-4 bg-muted rounded-lg space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Purchased At</Label>
                                  <p className="text-sm">{new Date(ticket.purchased_at).toLocaleString()}</p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Ticket Type</Label>
                                  <p className="text-sm">{ticket.ticket_type}</p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Payment Method</Label>
                                  <p className="text-sm">{ticket.payment_method || "Paystack"}</p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">QR Token</Label>
                                  <p className="text-sm font-mono text-xs">{ticket.qr_token?.slice(0, 20)}...</p>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>

              {filteredTickets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No tickets found
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* QR Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>QR Code Scanner</DialogTitle>
            <DialogDescription>
              Scan attendee tickets to validate and admit them
            </DialogDescription>
          </DialogHeader>
          <QRScanner 
            eventId={selectedEvent} 
            scanLocation="Main Entrance"
            onScanResult={handleScanResult}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
