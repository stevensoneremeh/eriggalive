"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { CreditCard, Shield, Clock, X } from "lucide-react"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  amount: number
  isDarkMode: boolean
}

export function PaymentModal({ isOpen, onClose, onSuccess, amount, isDarkMode }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")

  const handlePayment = async () => {
    if (!email || !name) {
      alert("Please fill in all fields")
      return
    }

    setIsProcessing(true)

    try {
      // Initialize Paystack payment
      const response = await fetch("/api/meet-greet/initialize-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: amount * 100, // Convert to kobo
          metadata: {
            name,
            service: "meet-greet",
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        // In a real implementation, you would redirect to Paystack
        // For demo purposes, we'll simulate a successful payment
        setTimeout(() => {
          setIsProcessing(false)
          onSuccess()
        }, 2000)
      } else {
        throw new Error(data.message || "Payment initialization failed")
      }
    } catch (error) {
      console.error("Payment error:", error)
      setIsProcessing(false)
      alert("Payment failed. Please try again.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`max-w-md ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
              Secure Payment
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-800"}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Summary */}
          <Card className={`${isDarkMode ? "bg-slate-700/50 border-slate-600" : "bg-slate-50 border-slate-200"}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                  <span className={`font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                    20-Minute Session
                  </span>
                </div>
                <span className={`text-lg font-bold ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                  ₦{amount.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className={isDarkMode ? "text-slate-300" : "text-slate-700"}>
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className={`mt-1 ${
                  isDarkMode
                    ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    : "bg-white border-slate-300 text-slate-800"
                }`}
              />
            </div>

            <div>
              <Label htmlFor="email" className={isDarkMode ? "text-slate-300" : "text-slate-700"}>
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`mt-1 ${
                  isDarkMode
                    ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    : "bg-white border-slate-300 text-slate-800"
                }`}
              />
            </div>
          </div>

          {/* Security Notice */}
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${
              isDarkMode
                ? "bg-green-900/20 text-green-400 border border-green-800"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span className="text-sm">Secured by Paystack. Your payment information is encrypted and safe.</span>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={isProcessing || !email || !name}
            className={`w-full py-3 text-lg font-semibold ${
              isDarkMode
                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            } text-white transition-all duration-300`}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing Payment...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pay ₦{amount.toLocaleString()} with Paystack
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
