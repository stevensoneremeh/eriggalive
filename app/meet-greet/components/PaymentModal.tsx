"use client"

import { useState } from "react"
import { X, CreditCard, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface PaymentModalProps {
  onClose: () => void
  onSuccess: (sessionData: any) => void
  isDarkMode: boolean
  userProfile: any
}

export default function PaymentModal({ onClose, onSuccess, isDarkMode, userProfile }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const initializePayment = async () => {
    if (!userProfile) {
      toast.error("Please sign in to continue")
      return
    }

    setIsProcessing(true)

    try {
      // Initialize payment with Paystack
      const response = await fetch("/api/meet-greet/initialize-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userProfile.email,
          amount: 10000000, // ₦100,000 in kobo
          callback_url: `${window.location.origin}/meet-greet`,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to Paystack payment page
        window.location.href = data.authorization_url
      } else {
        toast.error("Failed to initialize payment")
      }
    } catch (error) {
      console.error("Payment initialization error:", error)
      toast.error("Payment initialization failed")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className={`w-full max-w-md ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
          <CardTitle className={`text-center ${isDarkMode ? "text-white" : "text-gray-800"}`}>
            Complete Your Booking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Details */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>Session Duration:</span>
              <span className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>20 minutes</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>Amount:</span>
              <span className="font-bold text-2xl text-green-500">₦100,000</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 text-sm text-blue-500">
                <Shield className="w-4 h-4" />
                <span>Secure payment powered by Paystack</span>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={initializePayment}
            disabled={isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            {isProcessing ? "Processing..." : "Pay ₦100,000 with Paystack"}
          </Button>

          {/* Terms */}
          <p className={`text-xs text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            By proceeding, you agree to our terms of service. Payment is non-refundable once the session begins.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
