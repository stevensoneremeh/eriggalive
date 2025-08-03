"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock, Ticket, Star, Users } from "lucide-react"
import { motion } from "framer-motion"

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export function TicketsClient() {
  const { profile } = useAuth()
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)

  const events = [
    {
      id: "1",
      title: "Erigga Live in Lagos",
      date: "2024-03-15",
      time: "8:00 PM",
      venue: "Eko Convention Centre",
      location: "Lagos, Nigeria",
      price: "₦15,000",
      vipPrice: "₦35,000",
      image: "/placeholder.svg?height=200&width=400&text=Concert",
      status: "available",
      description: "Experience Erigga live with all his greatest hits and new tracks from his latest album.",
    },
    {
      id: "2",
      title: "Warri Homecoming Concert",
      date: "2024-04-20",
      time: "7:00 PM",
      venue: "Warri Township Stadium",
      location: "Warri, Delta State",
      price: "₦10,000",
      vipPrice: "₦25,000",
      image: "/placeholder.svg?height=200&width=400&text=Homecoming",
      status: "available",
      description: "Erigga returns home to Warri for an unforgettable night of music and celebration.",
    },
    {
      id: "3",
      title: "Abuja Music Festival",
      date: "2024-05-10",
      time: "6:00 PM",
      venue: "Abuja Stadium",
      location: "Abuja, FCT",
      price: "₦20,000",
      vipPrice: "₦45,000",
      image: "/placeholder.svg?height=200&width=400&text=Festival",
      status: "selling-fast",
      description: "Join Erigga and other top Nigerian artists at the biggest music festival of the year.",
    },
  ]

  const getTierDiscount = (tier: string) => {
    switch (tier) {
      case "blood_brotherhood":
        return 20
      case "elder":
        return 15
      case "pioneer":
        return 10
      case "grassroot":
        return 5
      default:
        return 0
    }
  }

  const calculateDiscountedPrice = (price: string, tier: string) => {
    const numericPrice = Number.parseInt(price.replace(/[₦,]/g, ""))
    const discount = getTierDiscount(tier)
    const discountedPrice = numericPrice - (numericPrice * discount) / 100
    return `₦${discountedPrice.toLocaleString()}`
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pt-20 pb-8"
    >
      <div className="container mx-auto px-4">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          {/* Header */}
          <motion.div variants={cardVariants} className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Concert Tickets
            </h1>
            <p className="text-muted-foreground">Get your tickets to see Erigga live in concert</p>
            {profile && getTierDiscount(profile.tier) > 0 && (
              <Badge className="mt-2 bg-green-100 text-green-800">
                <Star className="w-3 h-3 mr-1" />
                {getTierDiscount(profile.tier)}% Member Discount Applied
              </Badge>
            )}
          </motion.div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <motion.div key={event.id} variants={cardVariants} whileHover={{ scale: 1.02 }} className="group">
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge
                        variant={event.status === "available" ? "default" : "destructive"}
                        className={event.status === "selling-fast" ? "bg-orange-500 hover:bg-orange-600" : ""}
                      >
                        {event.status === "available"
                          ? "Available"
                          : event.status === "selling-fast"
                            ? "Selling Fast"
                            : "Sold Out"}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="text-xl">{event.title}</CardTitle>
                    <CardDescription>{event.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {event.venue}, {event.location}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">Regular Ticket</p>
                          <p className="text-sm text-muted-foreground">General admission</p>
                        </div>
                        <div className="text-right">
                          {profile && getTierDiscount(profile.tier) > 0 ? (
                            <>
                              <p className="text-sm text-muted-foreground line-through">{event.price}</p>
                              <p className="font-bold text-green-600">
                                {calculateDiscountedPrice(event.price, profile.tier)}
                              </p>
                            </>
                          ) : (
                            <p className="font-bold">{event.price}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div>
                          <p className="font-medium flex items-center">
                            <Star className="w-4 h-4 mr-1 text-yellow-500" />
                            VIP Ticket
                          </p>
                          <p className="text-sm text-muted-foreground">Front row + meet & greet</p>
                        </div>
                        <div className="text-right">
                          {profile && getTierDiscount(profile.tier) > 0 ? (
                            <>
                              <p className="text-sm text-muted-foreground line-through">{event.vipPrice}</p>
                              <p className="font-bold text-green-600">
                                {calculateDiscountedPrice(event.vipPrice, profile.tier)}
                              </p>
                            </>
                          ) : (
                            <p className="font-bold">{event.vipPrice}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button className="flex-1" disabled={event.status === "sold-out"}>
                        <Ticket className="w-4 h-4 mr-2" />
                        Buy Regular
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        disabled={event.status === "sold-out"}
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Buy VIP
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Tier Benefits */}
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Member Benefits</span>
                </CardTitle>
                <CardDescription>Upgrade your tier to unlock exclusive discounts and perks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Badge className="bg-green-100 text-green-800 mb-2">Grassroot</Badge>
                    <p className="font-semibold">5% Discount</p>
                    <p className="text-sm text-muted-foreground">Basic member benefits</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Badge className="bg-purple-100 text-purple-800 mb-2">Pioneer</Badge>
                    <p className="font-semibold">10% Discount</p>
                    <p className="text-sm text-muted-foreground">Early access to tickets</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Badge className="bg-blue-100 text-blue-800 mb-2">Elder</Badge>
                    <p className="font-semibold">15% Discount</p>
                    <p className="text-sm text-muted-foreground">Priority seating</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <Badge className="bg-yellow-100 text-yellow-800 mb-2">Blood Brotherhood</Badge>
                    <p className="font-semibold">20% Discount</p>
                    <p className="text-sm text-muted-foreground">VIP meet & greet included</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
