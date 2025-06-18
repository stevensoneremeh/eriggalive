"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, MapPin, Users, Clock, QrCode, Download, Share2 } from "lucide-react"

// Mock events data
const events = [
  {
    id: "1",
    title: "Warri Live Show 2024",
    description: "Experience Erigga live in his hometown with special guests and surprise performances",
    venue: "Warri City Stadium",
    location: "Warri, Delta State",
    date: "2024-12-25T20:00:00Z",
    price: 500000, // 5000 NGN in kobo
    maxTickets: 5000,
    ticketsSold: 3200,
    image: "/placeholder.svg?height=300&width=400",
    category: "Concert",
    isVip: false,
  },
  {
    id: "2",
    title: "Lagos Concert - Paper Boi Live",
    description: "The biggest Erigga concert in Lagos with full band and special effects",
    venue: "Eko Hotel Convention Centre",
    location: "Victoria Island, Lagos",
    date: "2025-01-15T19:00:00Z",
    price: 1000000, // 10000 NGN in kobo
    maxTickets: 3000,
    ticketsSold: 1800,
    image: "/placeholder.svg?height=300&width=400",
    category: "Concert",
    isVip: true,
  },
  {
    id: "3",
    title: "Abuja Street Vibes",
    description: "Intimate acoustic session with Q&A and meet & greet",
    venue: "Transcorp Hilton",
    location: "Abuja, FCT",
    date: "2025-02-20T18:00:00Z",
    price: 750000, // 7500 NGN in kobo
    maxTickets: 500,
    ticketsSold: 450,
    image: "/placeholder.svg?height=300&width=400",
    category: "Acoustic",
    isVip: false,
  },
]

// Mock user tickets
const userTickets = [
  {
    id: "ticket-001",
    eventId: "1",
    eventTitle: "Warri Live Show 2024",
    venue: "Warri City Stadium",
    date: "2024-12-25T20:00:00Z",
    ticketNumber: "WLS-2024-001523",
    qrCode:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzAwMCIvPgogIDxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSIxNjAiIGZpbGw9IiNmZmYiLz4KICA8dGV4dCB4PSIxMDAiIHk9IjEwNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzAwMCI+UVIgQ29kZTwvdGV4dD4KPC9zdmc+",
    status: "confirmed",
    purchasedAt: "2024-11-15T10:30:00Z",
  },
]

// Mock past events
const pastEvents = [
  {
    id: "past-1",
    title: "Port Harcourt Takeover",
    venue: "Liberation Stadium",
    date: "2024-10-15T20:00:00Z",
    attendees: 8000,
    highlights: ["Surprise guest appearances", "New song premiere", "Fan interaction"],
  },
  {
    id: "past-2",
    title: "Benin City Vibes",
    venue: "Samuel Ogbemudia Stadium",
    date: "2024-09-20T19:30:00Z",
    attendees: 6500,
    highlights: ["Acoustic set", "Fan stories session", "Merchandise giveaway"],
  },
]

export default function TicketsPage() {
  const [selectedEvent, setSelectedEvent] = useState<(typeof events)[0] | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const formatPrice = (priceInKobo: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(priceInKobo / 100)
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

  const handleTicketPurchase = async (event: (typeof events)[0]) => {
    setIsProcessing(true)

    try {
      // Initialize Paystack payment
      const handler = (window as any).PaystackPop.setup({
        key: "pk_test_0123456789abcdef0123456789abcdef01234567", // Paystack test public key
        email: "user@example.com", // This would come from auth context
        amount: event.price,
        currency: "NGN",
        ref: `ticket_${event.id}_${Date.now()}`,
        metadata: {
          event_id: event.id,
          event_title: event.title,
          ticket_type: "general",
        },
        callback: (response: any) => {
          // Handle successful payment
          console.log("Payment successful:", response)
          alert(`Payment successful! Reference: ${response.reference}`)
          // Here you would typically call your backend to create the ticket
        },
        onClose: () => {
          console.log("Payment window closed")
        },
      })

      handler.openIframe()
    } catch (error) {
      console.error("Payment error:", error)
      alert("Payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTicket = (ticket: (typeof userTickets)[0]) => {
    // Create a simple ticket download (in real app, this would generate a PDF)
    const ticketData = `
ERIGGA FAN PLATFORM - TICKET
${ticket.eventTitle}
Venue: ${ticket.venue}
Date: ${formatDate(ticket.date)}
Ticket #: ${ticket.ticketNumber}
Status: ${ticket.status.toUpperCase()}
    `

    const blob = new Blob([ticketData], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ticket-${ticket.ticketNumber}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-street text-4xl md:text-6xl text-gradient mb-4">LIVE SHOWS</h1>
          <p className="text-xl text-muted-foreground">
            Experience Erigga live. Feel the energy. Be part of the movement.
          </p>
        </div>

        {/* Your Tickets Section */}
        {userTickets.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <QrCode className="h-6 w-6 text-orange-500" />
              Your Tickets
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userTickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="bg-gradient-to-br from-orange-500/10 to-gold-400/10 border-orange-500/40"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-green-500 text-white">{ticket.status}</Badge>
                      <QrCode className="h-5 w-5 text-orange-500" />
                    </div>
                    <CardTitle className="text-lg">{ticket.eventTitle}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{ticket.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(ticket.date)}</span>
                      </div>
                    </div>

                    <div className="bg-background/50 p-3 rounded-lg text-center">
                      <img
                        src={ticket.qrCode || "/placeholder.svg"}
                        alt="QR Code"
                        className="w-20 h-20 mx-auto mb-2 bg-white p-1 rounded"
                      />
                      <p className="text-xs font-mono">{ticket.ticketNumber}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-black"
                        onClick={() => downloadTicket(ticket)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline" className="border-gold-400 text-gold-400">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-orange-500" />
            Upcoming Shows
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const availableTickets = event.maxTickets - event.ticketsSold
              const soldOutPercentage = (event.ticketsSold / event.maxTickets) * 100

              return (
                <Card
                  key={event.id}
                  className="bg-card/50 border-orange-500/20 hover:border-orange-500/40 transition-all group"
                >
                  <CardHeader className="p-0">
                    <div className="relative">
                      <img
                        src={event.image || "/placeholder.svg"}
                        alt={event.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      {event.isVip && <Badge className="absolute top-2 right-2 bg-gold-400 text-black">VIP</Badge>}
                      <Badge className="absolute top-2 left-2 bg-orange-500 text-black">{event.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-orange-500" />
                          <span>
                            {event.venue}, {event.location}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-orange-500" />
                          <span>{availableTickets} tickets left</span>
                        </div>
                      </div>

                      {/* Ticket availability bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Tickets sold</span>
                          <span>{soldOutPercentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-gold-400 h-2 rounded-full transition-all"
                            style={{ width: `${soldOutPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4">
                        <div>
                          <span className="text-2xl font-bold text-orange-500">{formatPrice(event.price)}</span>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              className="bg-orange-500 hover:bg-orange-600 text-black"
                              disabled={availableTickets === 0}
                              onClick={() => setSelectedEvent(event)}
                            >
                              {availableTickets === 0 ? "Sold Out" : "Buy Ticket"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Purchase Ticket</DialogTitle>
                            </DialogHeader>
                            {selectedEvent && (
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold">{selectedEvent.title}</h4>
                                  <p className="text-sm text-muted-foreground">{selectedEvent.venue}</p>
                                  <p className="text-sm text-muted-foreground">{formatDate(selectedEvent.date)}</p>
                                </div>

                                <div className="bg-orange-500/10 p-4 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span>Ticket Price:</span>
                                    <span className="text-xl font-bold text-orange-500">
                                      {formatPrice(selectedEvent.price)}
                                    </span>
                                  </div>
                                </div>

                                <Button
                                  className="w-full bg-orange-500 hover:bg-orange-600 text-black"
                                  onClick={() => handleTicketPurchase(selectedEvent)}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? "Processing..." : "Pay with Paystack"}
                                </Button>

                                <p className="text-xs text-muted-foreground text-center">
                                  Secure payment powered by Paystack. You'll receive your ticket via email after
                                  payment.
                                </p>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Past Shows */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Past Shows Recap</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pastEvents.map((event) => (
              <Card key={event.id} className="bg-card/50 border-orange-500/20">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-lg">{event.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.venue}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(event.date)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-orange-500" />
                      <span className="font-semibold">{event.attendees.toLocaleString()} fans attended</span>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Highlights:</h4>
                      <ul className="space-y-1">
                        {event.highlights.map((highlight, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* Paystack Script */}
      <script src="https://js.paystack.co/v1/inline.js"></script>
    </div>
  )
}
