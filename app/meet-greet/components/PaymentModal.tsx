"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Shield, Clock, X } from "lucide-react"
import { toast } from "sonner"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (paymentData: any) => void
  amount: number
  userEmail: string
}

export function PaymentModal({ isOpen, onClose, onSuccess, amount, userEmail }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank">("card")
  const [formData, setFormData] = useState({
    email: userEmail,
    phone: "",
    preferredTime: "",
    specialRequests: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePayment = async () => {
    if (!formData.email || !formData.phone) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsProcessing(true)

    try {
      // Initialize payment with Paystack
      const response = await fetch("/api/meet-greet/initialize-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          amount: amount * 100, // Convert to kobo
          phone: formData.phone,
          preferredTime: formData.preferredTime,
          specialRequests: formData.specialRequests,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // For demo purposes, simulate successful payment
        // In production, this would redirect to Paystack
        setTimeout(() => {
          const mockPaymentData = {
            reference: `ref_${Date.now()}`,
            status: "success",
            amount: amount,
            email: formData.email,
            phone: formData.phone,
            preferredTime: formData.preferredTime,
            specialRequests: formData.specialRequests,
          }

          onSuccess(mockPaymentData)
          toast.success("Payment successful! Your session has been booked.")
          setIsProcessing(false)
        }, 2000)
      } else {
        throw new Error(data.message || "Payment initialization failed")
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast.error("Payment failed. Please try again.")
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-white dark:bg-slate-800 border-0 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              Book Your Session
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Meet & Greet Session</span>
                <span className="font-bold text-blue-600">₦{amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                20 minutes exclusive video call
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+234 xxx xxx xxxx"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="preferredTime">Preferred Time (Optional)</Label>
              <Input
                id="preferredTime"
                type="text"
                value={formData.preferredTime}
                onChange={(e) => handleInputChange("preferredTime", e.target.value)}
                placeholder="e.g., Weekends, Evening"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
              <Input
                id="specialRequests"
                type="text"
                value={formData.specialRequests}
                onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                placeholder="Any special topics or requests"
                className="mt-1"
              />
            </div>
          </div>

          <Separator />

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-green-800 dark:text-green-400">Secure Payment</div>
              <div className="text-green-700 dark:text-green-300">
                Your payment is processed securely through Paystack
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold shadow-lg"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing Payment...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pay ₦{amount.toLocaleString()}
              </div>
            )}
          </Button>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            By proceeding, you agree to our terms and conditions. Sessions are non-refundable once confirmed.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
