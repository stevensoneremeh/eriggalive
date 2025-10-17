"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Ticket as TicketIcon, Check, X, Loader2, QrCode } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import QRCode from "qrcode"

interface Event {
  id: string
  title: string
  description: string
  venue: string
  event_date: string
  image_url: string
}

interface TicketData {
  id: string
  ticket_number: string
  qr_code: string
  qr_token: string
  price_paid_naira: number
  custom_amount: number | null
  ticket_type: string
  status: string
  admission_status: string
  seating_assignment: string | null
  seating_priority: number
  admitted_at: string | null
  purchased_at: string
  events: Event
}

export default function DashboardEventsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [qrImages, setQrImages] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = "/login?redirect=/dashboard/events"
        return
      }

      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          events (
            id,
            title,
            description,
            venue,
            event_date,
            image_url
          )
        `)
        .eq("user_id", user.id)
        .order("purchased_at", { ascending: false })

      if (error) {
        console.error("Error fetching tickets:", error)
        return
      }

      setTickets(data || [])

      const qrPromises = (data || []).map(async (ticket: TicketData) => {
        if (ticket.qr_code) {
          try {
            const qrDataUrl = await QRCode.toDataURL(ticket.qr_code, {
              width: 300,
              margin: 2,
              color: {
                dark: "#000000",
                light: "#FFFFFF",
              },
            })
            return { id: ticket.id, url: qrDataUrl }
          } catch (err) {
            console.error("Error generating QR code:", err)
            return { id: ticket.id, url: "" }
          }
        }
        return { id: ticket.id, url: "" }
      })

      const qrResults = await Promise.all(qrPromises)
      const qrMap = qrResults.reduce((acc, { id, url }) => {
        acc[id] = url
        return acc
      }, {} as Record<string, string>)
      
      setQrImages(qrMap)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      valid: { label: "Valid", className: "bg-green-500 text-white" },
      used: { label: "Used", className: "bg-blue-500 text-white" },
      cancelled: { label: "Cancelled", className: "bg-red-500 text-white" },
      refunded: { label: "Refunded", className: "bg-gray-500 text-white" },
    }

    const config = statusConfig[status] || { label: status, className: "bg-gray-500 text-white" }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getAdmissionBadge = (admissionStatus: string, admittedAt: string | null) => {
    if (admissionStatus === "admitted") {
      return (
        <Badge className="bg-green-500 text-white">
          <Check className="h-3 w-3 mr-1" />
          Admitted {admittedAt && `• ${new Date(admittedAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}`}
        </Badge>
      )
    } else if (admissionStatus === "denied") {
      return (
        <Badge className="bg-red-500 text-white">
          <X className="h-3 w-3 mr-1" />
          Denied
        </Badge>
      )
    }
    return (
      <Badge className="bg-yellow-500 text-black">
        Pending Admission
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-black text-white mb-8">My Events</h1>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-12 text-center">
              <TicketIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Tickets Yet</h3>
              <p className="text-gray-400 mb-6">You haven't purchased any event tickets.</p>
              <Link href="/events">
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  Browse Events
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">My Events</h1>
          <p className="text-gray-400">View your purchased tickets and QR codes</p>
        </div>

        <div className="grid gap-6">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="bg-gray-900 border-gray-800 overflow-hidden">
              <div className="md:flex">
                <div className="relative h-48 md:h-auto md:w-64 flex-shrink-0">
                  <Image
                    src={ticket.events.image_url || "/placeholder.svg"}
                    alt={ticket.events.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 p-6">
                  <CardHeader className="p-0 mb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-2xl text-white mb-2">
                          {ticket.events.title}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {getStatusBadge(ticket.status)}
                          {getAdmissionBadge(ticket.admission_status, ticket.admitted_at)}
                          {ticket.seating_assignment && (
                            <Badge className="bg-purple-500 text-white">
                              {ticket.seating_assignment}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center text-gray-300">
                          <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                          <span className="text-sm">{formatDate(ticket.events.event_date)}</span>
                        </div>
                        <div className="flex items-center text-gray-300">
                          <MapPin className="h-4 w-4 mr-2 text-orange-400" />
                          <span className="text-sm">{ticket.events.venue}</span>
                        </div>
                        <div className="flex items-center text-gray-300">
                          <TicketIcon className="h-4 w-4 mr-2 text-green-400" />
                          <span className="text-sm">{ticket.ticket_number}</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          <div>Type: <span className="text-white capitalize">{ticket.ticket_type}</span></div>
                          <div>
                            Paid: <span className="text-white font-semibold">
                              {formatCurrency(ticket.custom_amount || ticket.price_paid_naira)}
                            </span>
                            {ticket.custom_amount && (
                              <Badge className="ml-2 bg-yellow-500 text-black text-xs">Custom Amount</Badge>
                            )}
                          </div>
                          <div>Priority: <span className="text-white">{ticket.seating_priority}</span></div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center bg-white p-4 rounded-lg">
                        {ticket.admission_status === "admitted" ? (
                          <div className="text-center">
                            <Check className="h-20 w-20 text-green-500 mx-auto mb-3" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">ADMITTED</h3>
                            <p className="text-sm text-gray-600">
                              {ticket.admitted_at && formatDate(ticket.admitted_at)}
                            </p>
                          </div>
                        ) : qrImages[ticket.id] ? (
                          <div className="text-center">
                            <Image
                              src={qrImages[ticket.id]}
                              alt="QR Code"
                              width={200}
                              height={200}
                              className="mx-auto mb-2"
                            />
                            <div className="flex items-center justify-center text-xs text-gray-600">
                              <QrCode className="h-3 w-3 mr-1" />
                              Show this at the entrance
                            </div>
                          </div>
                        ) : (
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
