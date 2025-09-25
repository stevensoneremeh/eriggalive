"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PaystackPaymentProps {
  amount: number
  currency: string
  userEmail: string
  onSuccess: (reference: string) => void
  onError: (error: string) => void
  onClose: () => void
}

// Declare Paystack types for TypeScript
declare global {
  interface Window {
    PaystackPop: any
  }
}

export function PaystackPayment({ 
  amount, 
  currency, 
  userEmail, 
  onSuccess, 
  onError, 
  onClose 
}: PaystackPaymentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [paystackLoaded, setPaystackLoaded] = useState(false)
  const { toast } = useToast()

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    script.onload = () => setPaystackLoaded(true)
    script.onerror = () => {
      toast({
        title: "Payment Error",
        description: "Failed to load payment system. Please try again.",
        variant: "destructive"
      })
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [toast])

  const initiatePayment = () => {
    if (!paystackLoaded || !window.PaystackPop) {
      toast({
        title: "Payment System Loading",
        description: "Please wait for payment system to load...",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
      email: userEmail,
      amount: amount * 100, // Paystack expects amount in kobo
      currency: currency,
      ref: `erigga-meetgreet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        custom_fields: [
          {
            display_name: "Service",
            variable_name: "service",
            value: "Meet & Greet Video Call"
          }
        ]
      },
      callback: function(response: any) {
        setIsLoading(false)
        // Verify payment on backend
        verifyPayment(response.reference)
      },
      onClose: function() {
        setIsLoading(false)
        onClose()
      }
    })

    handler.openIframe()
  }

  const verifyPayment = async (reference: string) => {
    try {
      const response = await fetch('/api/meet-greet/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reference }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Payment Successful!",
          description: "Your payment has been verified. Redirecting to video call...",
        })
        onSuccess(reference)
      } else {
        throw new Error(data.message || 'Payment verification failed')
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      toast({
        title: "Verification Failed",
        description: "Payment verification failed. Please contact support.",
        variant: "destructive"
      })
      onError(error instanceof Error ? error.message : 'Payment verification failed')
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mx-auto mb-4 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center"
          >
            <CreditCard className="w-8 h-8 text-white" />
          </motion.div>
          <CardTitle className="text-2xl font-bold text-white">
            Premium Meet & Greet
          </CardTitle>
          <p className="text-white/80 mt-2">
            Exclusive video call with Erigga
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/80">Service:</span>
              <span className="font-semibold">Meet & Greet Call</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/80">Duration:</span>
              <span className="font-semibold">30 minutes</span>
            </div>
            <div className="border-t border-white/20 pt-3">
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold">Total Amount:</span>
                <span className="font-bold text-yellow-400">
                  {formatAmount(amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-2 text-sm text-white/90">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>High-quality video and audio</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Real-time chat support</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Secure and private connection</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Recording available (with permission)</span>
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={initiatePayment}
            disabled={isLoading || !paystackLoaded}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : !paystackLoaded ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading Payment System...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Pay {formatAmount(amount)}
              </>
            )}
          </Button>

          {/* Security Notice */}
          <div className="flex items-start space-x-2 text-xs text-white/70 bg-blue-500/20 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              Your payment is secured by Paystack's industry-standard encryption.
              We do not store your payment information.
            </p>
          </div>

          {/* Cancel Button */}
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-white/30 text-white hover:bg-white/10"
            disabled={isLoading}
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}