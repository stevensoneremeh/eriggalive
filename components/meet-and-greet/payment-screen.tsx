"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CreditCard, Shield, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface PaymentScreenProps {
  bookingData: { date: string; time: string; amount: number }
  user: any
  profile: any
  onSuccess: (bookingId: string) => void
  onBack: () => void
}

export function PaymentScreen({ bookingData, user, profile, onSuccess, onBack }: PaymentScreenProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handlePayment = async () => {
    if (!user || !profile) {
      toast({
        title: "Authentication Error",
        description: "Please log in to continue with payment.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Initialize Paystack payment
      const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

      if (!paystackPublicKey) {
        throw new Error("Paystack configuration missing")
      }

      // Create payment reference
      const reference = `meet_greet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Load Paystack script dynamically
      const script = document.createElement("script")
      script.src = "https://js.paystack.co/v1/inline.js"
      document.body.appendChild(script)

      script.onload = () => {
        const handler = (window as any).PaystackPop.setup({
          key: paystackPublicKey,
          email: user.email,
          amount: bookingData.amount * 100, // Convert to kobo
          currency: "NGN",
          ref: reference,
          metadata: {
            custom_fields: [
              {
                display_name: "Booking Date",
                variable_name: "booking_date",
                value: bookingData.date,
              },
              {
                display_name: "Booking Time",
                variable_name: "booking_time",
                value: bookingData.time,
              },
              {
                display_name: "Service Type",
                variable_name: "service_type",
                value: "Meet & Greet",
              },
            ],
          },
          callback: async (response: any) => {
            // Payment successful
            try {
              // Save booking to database
              const { data: booking, error: bookingError } = await supabase
                .from("meet_greet_bookings")
                .insert({
                  user_id: profile.id,
                  booking_date: bookingData.date,
                  booking_time: bookingData.time,
                  amount: bookingData.amount,
                  payment_reference: reference,
                  payment_status: "completed",
                  status: "confirmed",
                  created_at: new Date().toISOString(),
                })
                .select()
                .single()

              if (bookingError) {
                console.error("Booking save error:", bookingError)
              }

              // Save payment record
              const { error: paymentError } = await supabase.from("payments").insert({
                user_id: profile.id,
                amount: bookingData.amount,
                currency: "NGN",
                payment_method: "paystack",
                reference: reference,
                status: "completed",
                service_type: "meet_greet",
                metadata: {
                  booking_date: bookingData.date,
                  booking_time: bookingData.time,
                  paystack_reference: response.reference,
                },
                created_at: new Date().toISOString(),
              })

              if (paymentError) {
                console.error("Payment save error:", paymentError)
              }

              toast({
                title: "Payment Successful!",
                description: "Your Meet & Greet session has been booked.",
              })

              onSuccess(booking?.id || reference)
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
            setIsProcessing(false)
            toast({
              title: "Payment Cancelled",
              description: "You cancelled the payment process.",
              variant: "destructive",
            })
          },
        })

        handler.openIframe()
      }

      script.onerror = () => {
        setIsProcessing(false)
        toast({
          title: "Payment Error",
          description: "Failed to load payment system. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Payment error:", error)
      setIsProcessing(false)
      toast({
        title: "Payment Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative z-20"
    >
      <Card className="bg-white/90 backdrop-blur-md border-blue-200 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-4 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center"
          >
            <CreditCard className="w-8 h-8 text-white" />
          </motion.div>
          <CardTitle className="text-2xl font-bold text-blue-900">Secure Payment</CardTitle>
          <p className="text-blue-600 mt-2">Complete your spiritual journey booking</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Booking Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-50 p-4 rounded-lg space-y-3"
          >
            <h3 className="font-semibold text-blue-900 mb-3">Booking Summary</h3>
            <div className="flex items-center justify-between">
              <span className="flex items-center text-blue-700">
                <Clock className="w-4 h-4 mr-2" />
                Date & Time
              </span>
              <div className="text-right">
                <div className="font-medium text-blue-900">{formatDate(bookingData.date)}</div>
                <div className="text-sm text-blue-600">{formatTime(bookingData.time)}</div>
              </div>
            </div>
            <div className="border-t border-blue-200 pt-3 flex items-center justify-between">
              <span className="font-semibold text-blue-900">Total Amount</span>
              <span className="font-bold text-xl text-blue-900">₦{bookingData.amount.toLocaleString()}</span>
            </div>
          </motion.div>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center space-x-3 bg-green-50 p-3 rounded-lg"
          >
            <Shield className="w-5 h-5 text-green-600" />
            <div className="text-sm text-green-700">
              <p className="font-medium">Secure Payment</p>
              <p>Your payment is protected by Paystack encryption</p>
            </div>
          </motion.div>

          {/* Payment Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isProcessing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                />
              ) : null}
              {isProcessing ? "Processing Payment..." : "Pay with Paystack"}
            </Button>

            <Button
              onClick={onBack}
              variant="outline"
              disabled={isProcessing}
              className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Booking
            </Button>
          </motion.div>

          {/* Payment Methods */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-xs text-blue-500"
          >
            <p>Accepted: Card • Bank Transfer • USSD</p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
