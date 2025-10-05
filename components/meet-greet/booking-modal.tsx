"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { X, Video, Phone, Users, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface BookingModalProps {
  paymentMethod: "coins" | "paystack"
  onClose: () => void
  user: any
  profile: any
}

const meetingPackages = [
  {
    id: "video-15",
    name: "15-Min Video Call",
    duration: 15,
    price: 5000,
    type: "video",
    icon: <Video className="w-5 h-5" />,
    features: ["HD Video Call", "Screen Recording", "Personal Chat"],
  },
  {
    id: "audio-20",
    name: "20-Min Audio Call",
    duration: 20,
    price: 3000,
    type: "audio",
    icon: <Phone className="w-5 h-5" />,
    features: ["High Quality Audio", "Call Recording", "Personal Chat"],
  },
  {
    id: "group-30",
    name: "30-Min Group Session",
    duration: 30,
    price: 2000,
    type: "group",
    icon: <Users className="w-5 h-5" />,
    features: ["Group Video Call", "Up to 10 People", "Q&A Session"],
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

export default function BookingModal({ paymentMethod, onClose, user, profile }: BookingModalProps) {
  const { toast } = useToast()
  const supabase = createClient()

  const [step, setStep] = useState<"package" | "details" | "payment" | "confirmation">("package")
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")
  const [message, setMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null)

  const handlePackageSelect = (pkg: any) => {
    setSelectedPackage(pkg)
    setStep("details")
  }

  const handleBookingSubmit = async () => {
    if (!selectedPackage || !selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      if (paymentMethod === "coins") {
        // Check coin balance
        if (profile.coins < selectedPackage.price) {
          toast({
            title: "Insufficient Coins",
            description: `You need ${selectedPackage.price} coins but only have ${profile.coins}.`,
            variant: "destructive",
          })
          setIsProcessing(false)
          return
        }

        // Deduct coins and create booking
        const { error: updateError } = await supabase
          .from("users")
          .update({ coins: profile.coins - selectedPackage.price })
          .eq("id", profile.id)

        if (updateError) throw updateError

        // Create booking record
        const bookingData = {
          user_id: profile.id,
          package_id: selectedPackage.id,
          package_name: selectedPackage.name,
          booking_date: selectedDate.toISOString().split("T")[0],
          booking_time: selectedTime,
          duration: selectedPackage.duration,
          amount: selectedPackage.price,
          payment_method: "coins",
          status: "confirmed",
          message: message,
          created_at: new Date().toISOString(),
        }

        const { data: booking, error: bookingError } = await supabase
          .from("meet_greet_bookings")
          .insert(bookingData)
          .select()
          .single()

        if (bookingError) throw bookingError

        setBookingConfirmation({
          ...booking,
          booking_reference: `EL${Date.now().toString().slice(-6)}`,
        })
        setStep("confirmation")
      } else {
        // Paystack payment
        setStep("payment")
      }

      toast({
        title: "Booking Successful!",
        description: "Your meet & greet session has been booked.",
      })
    } catch (error) {
      console.error("Booking error:", error)
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaystackPayment = async () => {
    if (!selectedPackage || !selectedDate || !selectedTime) return

    const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
    if (!paystackPublicKey) {
      toast({
        title: "Payment Error",
        description: "Payment system not configured.",
        variant: "destructive",
      })
      return
    }

    const reference = `meet_greet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Load Paystack script
    const script = document.createElement("script")
    script.src = "https://js.paystack.co/v1/inline.js"
    document.body.appendChild(script)

    script.onload = () => {
      const handler = (window as any).PaystackPop.setup({
        key: paystackPublicKey,
        email: user.email,
        amount: selectedPackage.price * 100, // Convert to kobo
        currency: "NGN",
        ref: reference,
        callback: async (response: any) => {
          // Payment successful, create booking
          try {
            const bookingData = {
              user_id: profile.id,
              package_id: selectedPackage.id,
              package_name: selectedPackage.name,
              booking_date: selectedDate.toISOString().split("T")[0],
              booking_time: selectedTime,
              duration: selectedPackage.duration,
              amount: selectedPackage.price,
              payment_method: "paystack",
              payment_reference: reference,
              status: "confirmed",
              message: message,
              created_at: new Date().toISOString(),
            }

            const { data: booking, error: bookingError } = await supabase
              .from("meet_greet_bookings")
              .insert(bookingData)
              .select()
              .single()

            if (bookingError) throw bookingError

            setBookingConfirmation({
              ...booking,
              booking_reference: `EL${Date.now().toString().slice(-6)}`,
            })
            setStep("confirmation")
          } catch (error) {
            console.error("Post-payment error:", error)
            toast({
              title: "Booking Error",
              description: "Payment successful but booking failed. Please contact support.",
              variant: "destructive",
            })
          }
        },
        onClose: () => {
          toast({
            title: "Payment Cancelled",
            description: "You cancelled the payment process.",
            variant: "destructive",
          })
        },
      })

      handler.openIframe()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card className="bg-black/90 border-gold/30 text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">
              {step === "package" && "Choose Your Experience"}
              {step === "details" && "Booking Details"}
              {step === "payment" && "Payment Processing"}
              {step === "confirmation" && "Booking Confirmed!"}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Package Selection */}
            {step === "package" && (
              <div className="grid gap-4">
                {meetingPackages.map((pkg) => (
                  <motion.div key={pkg.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Card
                      className="bg-gray-800/50 border-gold/20 cursor-pointer hover:border-gold/50 transition-colors"
                      onClick={() => handlePackageSelect(pkg)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center">
                              {pkg.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{pkg.name}</h3>
                              <p className="text-sm text-gray-400">{pkg.duration} minutes</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gold">
                              {paymentMethod === "coins"
                                ? `${pkg.price.toLocaleString()} coins`
                                : `₦${pkg.price.toLocaleString()}`}
                            </div>
                            <div className="flex space-x-1">
                              {pkg.features.map((feature, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Booking Details */}
            {step === "details" && selectedPackage && (
              <div className="space-y-6">
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gold mb-2">Selected Package</h3>
                  <div className="flex items-center justify-between">
                    <span>{selectedPackage.name}</span>
                    <span className="font-bold">
                      {paymentMethod === "coins"
                        ? `${selectedPackage.price.toLocaleString()} coins`
                        : `₦${selectedPackage.price.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Preferred Date</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                      className="rounded-md border border-gold/30 bg-gray-800/50"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Preferred Time (WAT)</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger className="bg-gray-800/50 border-gold/30 text-white">
                        <SelectValue placeholder="Select time slot" />
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

                  <div>
                    <Label className="text-white">Message (Optional)</Label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Any special requests or what you'd like to discuss..."
                      className="bg-gray-800/50 border-gold/30 text-white"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep("package")}
                    className="flex-1 border-gold/30 text-gold hover:bg-gold/10"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={paymentMethod === "paystack" ? handlePaystackPayment : handleBookingSubmit}
                    disabled={!selectedDate || !selectedTime || isProcessing}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-gold hover:from-purple-700 hover:to-yellow-500"
                  >
                    {isProcessing
                      ? "Processing..."
                      : paymentMethod === "coins"
                        ? `Pay ${selectedPackage.price.toLocaleString()} Coins`
                        : `Pay ₦${selectedPackage.price.toLocaleString()}`}
                  </Button>
                </div>
              </div>
            )}

            {/* Confirmation */}
            {step === "confirmation" && bookingConfirmation && (
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto"
                >
                  <CheckCircle className="w-8 h-8 text-white" />
                </motion.div>

                <div>
                  <h3 className="text-xl font-bold text-green-400 mb-2">Booking Confirmed!</h3>
                  <p className="text-gray-300">Reference: {bookingConfirmation.booking_reference}</p>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Package:</span>
                    <span className="font-semibold">{bookingConfirmation.package_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(bookingConfirmation.booking_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>{bookingConfirmation.booking_time} WAT</span>
                  </div>
                </div>

                <div className="bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-300 mb-2">What's Next?</h4>
                  <ul className="text-sm text-blue-200 space-y-1 text-left">
                    <li>• You'll receive a confirmation email with meeting details</li>
                    <li>• A calendar invite will be sent 24 hours before the session</li>
                    <li>• Join the meeting using the link provided in the email</li>
                    <li>• Make sure you have a stable internet connection</li>
                  </ul>
                </div>

                <Button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-purple-600 to-gold hover:from-purple-700 hover:to-yellow-500"
                >
                  Done
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
