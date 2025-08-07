"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Phone, Video, Clock, CalendarIcon, Coins, Star, CheckCircle, Users, Crown, Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface MeetPackage {
  id: string
  name: string
  description: string
  duration: number // in minutes
  price: number // in coins
  features: string[]
  type: "video" | "audio" | "group"
  max_participants?: number
  icon: React.ReactNode
  popular?: boolean
}

interface BookingForm {
  package_id: string
  preferred_date: Date | undefined
  preferred_time: string
  message: string
  participants: number
}

export default function MeetAndGreetPage() {
  const { user, profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [selectedPackage, setSelectedPackage] = useState<MeetPackage | null>(null)
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    package_id: "",
    preferred_date: undefined,
    preferred_time: "",
    message: "",
    participants: 1,
  })
  const [isBooking, setIsBooking] = useState(false)
  const [bookingStep, setBookingStep] = useState<"select" | "details" | "payment" | "confirmation">("select")
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null)

  const packages: MeetPackage[] = [
    {
      id: "video-solo",
      name: "Solo Video Call",
      description: "One-on-one video call with Erigga",
      duration: 15,
      price: 5000,
      features: [
        "15-minute private video call",
        "Personal conversation",
        "Photo opportunity (screenshot)",
        "Exclusive access",
        "Recording available",
      ],
      type: "video",
      icon: <Video className="w-6 h-6" />,
      popular: true,
    },
    {
      id: "audio-solo",
      name: "Solo Audio Call",
      description: "Personal phone call with Erigga",
      duration: 20,
      price: 3000,
      features: [
        "20-minute private audio call",
        "Personal conversation",
        "Exclusive access",
        "Recording available",
        "More intimate setting",
      ],
      type: "audio",
      icon: <Phone className="w-6 h-6" />,
    },
    {
      id: "group-video",
      name: "Group Video Session",
      description: "Group video call with other fans",
      duration: 30,
      price: 2000,
      features: [
        "30-minute group video call",
        "Up to 10 participants",
        "Q&A session",
        "Group photo opportunity",
        "Community interaction",
      ],
      type: "group",
      max_participants: 10,
      icon: <Users className="w-6 h-6" />,
    },
    {
      id: "premium-video",
      name: "Premium Experience",
      description: "Extended premium video session",
      duration: 45,
      price: 8000,
      features: [
        "45-minute premium video call",
        "Extended conversation time",
        "Personalized message",
        "Exclusive content preview",
        "Priority booking",
        "Digital autograph",
      ],
      type: "video",
      icon: <Crown className="w-6 h-6" />,
    },
  ]

  const timeSlots = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
  ]

  const handlePackageSelect = (pkg: MeetPackage) => {
    setSelectedPackage(pkg)
    setBookingForm((prev) => ({ ...prev, package_id: pkg.id }))
    setBookingStep("details")
  }

  const handleBookingSubmit = async () => {
    if (!selectedPackage || !profile || !bookingForm.preferred_date || !bookingForm.preferred_time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (profile.coins < selectedPackage.price) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${selectedPackage.price} coins but only have ${profile.coins}.`,
        variant: "destructive",
      })
      return
    }

    setIsBooking(true)

    try {
      // Deduct coins
      const newCoins = profile.coins - selectedPackage.price

      const { error: updateError } = await supabase.from("users").update({ coins: newCoins }).eq("id", profile.id)

      if (updateError) throw updateError

      // Create booking record (you would have a bookings table)
      const bookingData = {
        user_id: profile.id,
        package_id: selectedPackage.id,
        preferred_date: bookingForm.preferred_date.toISOString(),
        preferred_time: bookingForm.preferred_time,
        message: bookingForm.message,
        participants: bookingForm.participants,
        status: "pending",
        coins_paid: selectedPackage.price,
      }

      // In a real app, you would insert this into a bookings table
      // const { data: booking, error: bookingError } = await supabase
      //   .from("bookings")
      //   .insert(bookingData)
      //   .select()
      //   .single()

      // For demo purposes, create a mock booking confirmation
      const mockBooking = {
        id: `booking-${Date.now()}`,
        ...bookingData,
        booking_reference: `EL${Date.now().toString().slice(-6)}`,
        created_at: new Date().toISOString(),
      }

      setBookingConfirmation(mockBooking)
      await refreshProfile()
      setBookingStep("confirmation")

      toast({
        title: "Booking Confirmed! 🎉",
        description: `Your ${selectedPackage.name} has been booked successfully!`,
      })
    } catch (error) {
      console.error("Booking error:", error)
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsBooking(false)
    }
  }

  const resetBooking = () => {
    setSelectedPackage(null)
    setBookingForm({
      package_id: "",
      preferred_date: undefined,
      preferred_time: "",
      message: "",
      participants: 1,
    })
    setBookingStep("select")
    setBookingConfirmation(null)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meet & Greet</h1>
                <p className="text-gray-600 dark:text-gray-300">Book a personal session with Erigga</p>
              </div>
            </div>

            {/* User Coins Display */}
            <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                      <Coins className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Your Balance</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {profile?.coins?.toLocaleString() || 0} coins
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Buy More Coins
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Flow */}
          {bookingStep === "select" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Choose Your Experience</h2>
                <p className="text-gray-600 dark:text-gray-300">Select the perfect meet & greet package for you</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {packages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className={`border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm cursor-pointer transition-all hover:shadow-xl hover:scale-105 ${
                      pkg.popular ? "ring-2 ring-purple-500" : ""
                    }`}
                    onClick={() => handlePackageSelect(pkg)}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-purple-500 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="text-center pb-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                        {pkg.icon}
                      </div>
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <CardDescription className="text-sm">{pkg.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {pkg.price.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                          <Coins className="w-4 h-4 mr-1 text-yellow-500" />
                          coins
                        </div>
                      </div>

                      <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {pkg.duration}min
                        </div>
                        {pkg.max_participants && (
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            Max {pkg.max_participants}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {pkg.features.map((feature, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Button
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        disabled={profile?.coins < pkg.price}
                      >
                        {profile?.coins < pkg.price ? "Insufficient Coins" : "Select Package"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {bookingStep === "details" && selectedPackage && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Booking Details</h2>
                <p className="text-gray-600 dark:text-gray-300">Complete your {selectedPackage.name} booking</p>
              </div>

              <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {selectedPackage.icon}
                    <span className="ml-2">{selectedPackage.name}</span>
                    <Badge className="ml-auto">{selectedPackage.price.toLocaleString()} coins</Badge>
                  </CardTitle>
                  <CardDescription>{selectedPackage.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Date Selection */}
                  <div className="space-y-2">
                    <Label>Preferred Date</Label>
                    <Calendar
                      mode="single"
                      selected={bookingForm.preferred_date}
                      onSelect={(date) => setBookingForm((prev) => ({ ...prev, preferred_date: date }))}
                      disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                      className="rounded-md border"
                    />
                  </div>

                  {/* Time Selection */}
                  <div className="space-y-2">
                    <Label>Preferred Time (WAT)</Label>
                    <Select
                      value={bookingForm.preferred_time}
                      onValueChange={(value) => setBookingForm((prev) => ({ ...prev, preferred_time: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Participants (for group sessions) */}
                  {selectedPackage.type === "group" && (
                    <div className="space-y-2">
                      <Label>Number of Participants</Label>
                      <Select
                        value={bookingForm.participants.toString()}
                        onValueChange={(value) =>
                          setBookingForm((prev) => ({ ...prev, participants: Number.parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: selectedPackage.max_participants || 1 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} participant{num > 1 ? "s" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Message */}
                  <div className="space-y-2">
                    <Label>Message (Optional)</Label>
                    <Textarea
                      placeholder="Any special requests or what you'd like to talk about..."
                      value={bookingForm.message}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, message: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <Button variant="outline" onClick={() => setBookingStep("select")} className="flex-1">
                      Back
                    </Button>
                    <Button
                      onClick={handleBookingSubmit}
                      disabled={!bookingForm.preferred_date || !bookingForm.preferred_time || isBooking}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {isBooking ? "Processing..." : `Pay ${selectedPackage.price.toLocaleString()} Coins`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {bookingStep === "confirmation" && bookingConfirmation && selectedPackage && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Booking Confirmed!</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Your meet & greet session has been successfully booked
                </p>
              </div>

              <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-center">Booking Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{selectedPackage.name}</div>
                    <div className="text-lg text-gray-600 dark:text-gray-400">
                      Reference: {bookingConfirmation.booking_reference}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <CalendarIcon className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                      <div className="font-semibold">Date</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(bookingConfirmation.preferred_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Clock className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                      <div className="font-semibold">Time</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {bookingConfirmation.preferred_time} WAT
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">What's Next?</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• You'll receive a confirmation email with meeting details</li>
                      <li>• A calendar invite will be sent 24 hours before the session</li>
                      <li>• Join the meeting using the link provided in the email</li>
                      <li>• Make sure you have a stable internet connection</li>
                    </ul>
                  </div>

                  {bookingConfirmation.message && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-semibold mb-2">Your Message</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{bookingConfirmation.message}</p>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <Button variant="outline" onClick={resetBooking} className="flex-1 bg-transparent">
                      Book Another Session
                    </Button>
                    <Button className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      <Heart className="w-4 h-4 mr-2" />
                      Share Experience
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* FAQ Section */}
          {bookingStep === "select" && (
            <Card className="mt-12 border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">How do I join my session?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You'll receive an email with a meeting link 24 hours before your scheduled session. Simply click the
                    link at the scheduled time.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Can I reschedule my booking?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Yes, you can reschedule up to 48 hours before your session. Contact support for assistance.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">What if I have technical issues?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Our support team will be available during your session to help with any technical difficulties.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Are recordings available?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Yes, most packages include a recording that will be sent to you within 24 hours after the session.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
