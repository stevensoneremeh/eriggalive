"use client"
import { AuthGuard } from "@/components/auth-guard"
import { TicketsClient } from "./tickets-client"

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
  return (
    <AuthGuard>
      <TicketsClient />
    </AuthGuard>
  )
}
