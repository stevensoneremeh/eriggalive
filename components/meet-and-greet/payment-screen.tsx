"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CreditCard, Shield, Calendar, Clock } from "lucide-react"

interface PaymentScreenProps {
  bookingData: { date: string; time: string }
  onSuccess: () => void
  onBack: () => void
}

export function PaymentScreen({ bookingData, onSuccess, onBack }: PaymentScreenProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const handlePayment = async () => {
    setIsProcessing(true)

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      onSuccess()
    }, 3000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="relative z-20"
    >
      <Card className="bg-white/90 backdrop-blur-md border-blue-200/50 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-2 w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center"
          >
            <CreditCard className="w-6 h-6 text-white" />
          </motion.div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
            Secure Payment
          </CardTitle>
          <p className="text-green-600/70 text-sm">Complete your booking with secure payment</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Booking Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-50/50 rounded-lg p-4 space-y-3"
          >
            <h3 className="font-semibold text-blue-800 mb-3">Booking Summary</h3>
            <div className="flex items-center text-sm text-blue-700">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{formatDate(bookingData.date)}</span>
            </div>
            <div className="flex items-center text-sm text-blue-700">
              <Clock className="w-4 h-4 mr-2" />
              <span>{formatTime(bookingData.time)}</span>
            </div>
            <div className="border-t border-blue-200 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Session Fee</span>
                <span className="font-semibold text-blue-800">₦5,000</span>
              </div>
            </div>
          </motion.div>

          {/* Payment Method */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <h3 className="font-semibold text-blue-800">Payment Method</h3>
            <div className="border border-blue-200 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-green-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center mr-3">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Paystack</p>
                    <p className="text-xs text-gray-600">Secure payment gateway</p>
                  </div>
                </div>
                <div className="text-xs text-green-600 font-medium">SSL Secured</div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing Payment...
                </div>
              ) : (
                "Pay ₦5,000"
              )}
            </Button>

            <Button
              onClick={onBack}
              variant="outline"
              className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
              disabled={isProcessing}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Booking
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-xs text-blue-600/60"
          >
            Your payment is secured with 256-bit SSL encryption
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
