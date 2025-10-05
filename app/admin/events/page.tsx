"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Calendar, MapPin, Users, Plus, Search, Edit, Trash2, Eye } from "lucide-react"
import { toast } from "sonner"

interface Event {
  id: string
  title: string
  description: string
  event_date: string
  venue: string
  city?: string
  max_attendees: number
  current_attendance: number
  ticket_price_naira?: number
  ticket_price_coins?: number
  vip_price_naira?: number
  image_url?: string
  status: string
  contact?: string
  created_at: string
}

interface EventForm {
  title: string
  description: string
  event_date: string
  venue: string
  city: string
  max_attendees: string
  ticket_price_naira: string
  ticket_price_coins: string
  vip_price_naira: string
  image_url: string
  status: string
  contact: string
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null)
  const [formData, setFormData] = useState<EventForm>({
    title: "",
    description: "",
    event_date: "",
    venue: "",
    city: "",
    max_attendees: "100",
    ticket_price_naira: "",
    ticket_price_coins: "",
    vip_price_naira: "",
    image_url: "",
    status: "draft",
    contact: "",
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/events")
      if (!response.ok) throw new Error("Failed to fetch events")
      const data = await response.json()
      setEvents(data.events || [])
    } catch (error: any) {
      console.error("Error fetching events:", error)
      toast.error("Failed to load events")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.event_date || !formData.venue) {
      toast.error("Please fill in required fields")
      return
    }

    try {
      const url = editingEvent ? `/api/admin/events/${editingEvent.id}` : "/api/admin/events"
      const method = editingEvent ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save event")
      }

      toast.success(editingEvent ? "Event updated successfully" : "Event created successfully")
      setIsDialogOpen(false)
      resetForm()
      fetchEvents()
    } catch (error: any) {
      console.error("Error saving event:", error)
      toast.error(error.message || "Failed to save event")
    }
  }

  const handleDelete = async () => {
    if (!deletingEvent) return

    try {
      const response = await fetch(`/api/admin/events/${deletingEvent.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete event")
      }

      toast.success("Event deleted successfully")
      setIsDeleteDialogOpen(false)
      setDeletingEvent(null)
      fetchEvents()
    } catch (error: any) {
      console.error("Error deleting event:", error)
      toast.error(error.message || "Failed to delete event")
    }
  }

  const openCreateDialog = () => {
    resetForm()
    setEditingEvent(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (event: Event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description || "",
      event_date: event.event_date.split("T")[0] + "T" + event.event_date.split("T")[1]?.slice(0, 5) || "",
      venue: event.venue,
      city: event.city || "",
      max_attendees: event.max_attendees?.toString() || "100",
      ticket_price_naira: event.ticket_price_naira?.toString() || "",
      ticket_price_coins: event.ticket_price_coins?.toString() || "",
      vip_price_naira: event.vip_price_naira?.toString() || "",
      image_url: event.image_url || "",
      status: event.status,
      contact: event.contact || "",
    })
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (event: Event) => {
    setDeletingEvent(event)
    setIsDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      event_date: "",
      venue: "",
      city: "",
      max_attendees: "100",
      ticket_price_naira: "",
      ticket_price_coins: "",
      vip_price_naira: "",
      image_url: "",
      status: "draft",
      contact: "",
    })
    setEditingEvent(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "upcoming":
        return "bg-blue-100 text-blue-800"
      case "live":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-purple-100 text-purple-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
          <h1 className="text-3xl font-bold">Events Management</h1>
          <p className="text-muted-foreground">Create and manage events</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredEvents.map((event) => (
          <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                    <p className="text-muted-foreground mb-4">{event.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span>{formatDate(event.event_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        <span>{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-500" />
                        <span>
                          {event.current_attendance}/{event.max_attendees}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getStatusColor(event.status)}>{event.status.toUpperCase()}</Badge>
                    {event.ticket_price_naira && (
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(event.ticket_price_naira)}</div>
                        {event.vip_price_naira && (
                          <div className="text-sm text-muted-foreground">
                            VIP: {formatCurrency(event.vip_price_naira)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min((event.current_attendance / event.max_attendees) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {Math.round((event.current_attendance / event.max_attendees) * 100)}% full
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(event)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 bg-transparent"
                      onClick={() => openDeleteDialog(event)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "No events match your search criteria." : "No events have been created yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Event" : "Create Event"}</DialogTitle>
            <DialogDescription>
              {editingEvent ? "Update event details below" : "Fill in the event details below"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Event title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_date">
                  Event Date & Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="event_date"
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_attendees">Max Attendees</Label>
                <Input
                  id="max_attendees"
                  type="number"
                  value={formData.max_attendees}
                  onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="venue">
                  Venue <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="Event venue"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticket_price_naira">Ticket Price (₦)</Label>
                <Input
                  id="ticket_price_naira"
                  type="number"
                  value={formData.ticket_price_naira}
                  onChange={(e) => setFormData({ ...formData, ticket_price_naira: e.target.value })}
                  placeholder="5000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vip_price_naira">VIP Price (₦)</Label>
                <Input
                  id="vip_price_naira"
                  type="number"
                  value={formData.vip_price_naira}
                  onChange={(e) => setFormData({ ...formData, vip_price_naira: e.target.value })}
                  placeholder="10000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticket_price_coins">Ticket Price (Coins)</Label>
                <Input
                  id="ticket_price_coins"
                  type="number"
                  value={formData.ticket_price_coins}
                  onChange={(e) => setFormData({ ...formData, ticket_price_coins: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">Contact</Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="Contact info"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingEvent ? "Update Event" : "Create Event"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event "{deletingEvent?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
