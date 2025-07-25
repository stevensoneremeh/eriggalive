"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { CreditCard, CalendarIcon, Shield, CheckCircle, X, Zap } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  sessionType: {
    id: string
    name: string
    description: string
    duration: number
    price: number
    icon: any
    color: string
    features: string[]
  }
  onSuccess: (sessionData: any) => void
}

const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
]

export function PaymentModal({ isOpen, onClose, sessionType, onSuccess }: PaymentModalProps) {
  const { profile } = useAuth()
  const [step, setStep] = useState(1) // 1: Schedule, 2: Payment, 3: Processing, 4: Success
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")
  const [loading, setLoading] = useState(false)
  const [paymentData, setPaymentData] = useState({
    email: profile?.email || "",
    phone: "",
    name: profile?.full_name || "",
  })

  const Icon = sessionType.icon

  const handleScheduleNext = () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select both date and time")
      return
    }

    // Check if selected date is in the future
    const selectedDateTime = new Date(selectedDate)
    selectedDateTime.setHours(Number.parseInt(selectedTime.split(":")[0]), Number.parseInt(selectedTime.split(":")[1]))

    if (selectedDateTime <= new Date()) {
      toast.error("Please select a future date and time")
      return
    }

    setStep(2)
  }

  const handlePayment = async () => {
    if (!paymentData.email || !paymentData.phone || !paymentData.name) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    setStep(3)

    try {
      // Initialize payment with Paystack
      const response = await fetch("/api/meet-greet/initialize-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: paymentData.email,
          amount: sessionType.price,
          session_type: sessionType.id,
          scheduled_at: new Date(selectedDate!).toISOString(),
          scheduled_time: selectedTime,
          duration_minutes: sessionType.duration,
          user_data: {
            name: paymentData.name,
            phone: paymentData.phone,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Payment initialization failed")
      }

      // Redirect to Paystack payment page
      if (data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        // Mock success for demo
        setTimeout(() => {
          setStep(4)
          setTimeout(() => {
            onSuccess({
              session_id: data.session_id || "mock-session-id",
              reference: data.reference || "mock-reference",
            })
          }, 2000)
        }, 2000)
      }
    } catch (error: any) {
      console.error("Payment error:", error)
      toast.error(error.message || "Payment failed")
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return `₦${(price / 100).toLocaleString()}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className={`p-2 rounded-full bg-gradient-to-r ${sessionType.color}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              Book {sessionType.name}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {step > stepNumber ? <CheckCircle className="h-4 w-4" /> : stepNumber}
              </div>
              {stepNumber < 4 && (
                <div
                  className={`w-12 h-0.5 ${
                    step > stepNumber ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-slate-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Schedule */}
        {step === 1 && (
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-white">{sessionType.name}</h3>
                    <p className="text-slate-300 text-sm">{sessionType.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-400">{formatPrice(sessionType.price)}</div>
                    <div className="text-slate-400 text-sm">{sessionType.duration} minutes</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-white mb-3 block">Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                  className="rounded-md border border-slate-700 bg-slate-800/50"
                />
              </div>

              <div>
                <Label className="text-white mb-3 block">Select Time</Label>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {TIME_SLOTS.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                      className={
                        selectedTime === time
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                          : "border-slate-600 text-slate-300 hover:bg-slate-700"
                      }
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 bg-transparent">
                Cancel
              </Button>
              <Button
                onClick={handleScheduleNext}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Continue to Payment
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-3">Session Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Session Type:</span>
                    <span className="text-white">{sessionType.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Date:</span>
                    <span className="text-white">{selectedDate?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Time:</span>
                    <span className="text-white">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Duration:</span>
                    <span className="text-white">{sessionType.duration} minutes</span>
                  </div>
                  <Separator className="bg-slate-700" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Total:</span>
                    <span className="text-yellow-400 text-lg">{formatPrice(sessionType.price)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="font-semibold text-white">Payment Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-white">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={paymentData.name}
                    onChange={(e) => setPaymentData((prev) => ({ ...prev, name: e.target.value }))}
                    className="bg-slate-800/50 border-slate-600 text-white"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-white">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={paymentData.email}
                    onChange={(e) => setPaymentData((prev) => ({ ...prev, email: e.target.value }))}
                    className="bg-slate-800/50 border-slate-600 text-white"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone" className="text-white">
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  value={paymentData.phone}
                  onChange={(e) => setPaymentData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="bg-slate-800/50 border-slate-600 text-white"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="border-slate-600 text-slate-300">
                Back
              </Button>
              <Button
                onClick={handlePayment}
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay {formatPrice(sessionType.price)}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 3 && (
          <div className="text-center py-12">
            <div className="mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-white mb-2">Processing Payment</h3>
              <p className="text-slate-300">Please wait while we process your payment...</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-center gap-2 text-yellow-400">
                <Shield className="h-4 w-4" />
                <span className="text-sm">Secured by Paystack</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="text-center py-12">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">Payment Successful!</h3>
              <p className="text-slate-300 mb-4">Your Meet & Greet session has been booked successfully.</p>

              <Card className="bg-slate-800/50 border-slate-700 text-left max-w-md mx-auto">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-white mb-3">Session Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Session:</span>
                      <span className="text-white">{sessionType.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Date & Time:</span>
                      <span className="text-white">
                        {selectedDate?.toLocaleDateString()} at {selectedTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Duration:</span>
                      <span className="text-white">{sessionType.duration} minutes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-400">
                You will receive a confirmation email with your session details and join link.
              </p>
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                <Zap className="h-4 w-4 mr-2" />
                Awesome!
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
