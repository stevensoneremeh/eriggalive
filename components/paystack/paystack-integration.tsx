"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface PaystackIntegrationProps {
  amount: number // in naira
  email: string
  metadata?: Record<string, any>
  onSuccess: (reference: string) => void
  onError: (error: string) => void
  onClose?: () => void
  children: React.ReactNode
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string
        email: string
        amount: number
        currency: string
        ref: string
        metadata?: any
        callback: (response: any) => void
        onClose: () => void
      }) => {
        openIframe: () => void
      }
    }
  }
}

export function PaystackIntegration({
  amount,
  email,
  metadata,
  onSuccess,
  onError,
  onClose,
  children,
}: PaystackIntegrationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isPaystackLoaded, setIsPaystackLoaded] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadPaystack = () => {
      if (typeof window !== "undefined") {
        // Check if Paystack is already loaded
        if (window.PaystackPop) {
          setIsPaystackLoaded(true)
          return
        }

        // Check if script is already in DOM
        const existingScript = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]')
        if (existingScript) {
          existingScript.addEventListener("load", () => setIsPaystackLoaded(true))
          return
        }

        // Create and load script
        const script = document.createElement("script")
        script.src = "https://js.paystack.co/v1/inline.js"
        script.async = true

        script.onload = () => {
          setIsPaystackLoaded(true)
        }

        script.onerror = () => {
          onError("Failed to load payment gateway")
        }

        document.head.appendChild(script)
      }
    }

    loadPaystack()
  }, [onError])

  const handlePayment = async () => {
    if (!isPaystackLoaded) {
      onError("Payment gateway not ready")
      return
    }

    if (!email) {
      onError("Email is required for payment")
      return
    }

    setIsLoading(true)

    try {
      const reference = `erigga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const handler = window.PaystackPop!.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_0123456789abcdef0123456789abcdef01234567",
        email,
        amount: Math.round(amount * 100), // Convert to kobo
        currency: "NGN",
        ref: reference,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
        callback: (response: any) => {
          setIsLoading(false)
          if (response.status === "success") {
            onSuccess(response.reference)
            toast({
              title: "Payment Successful",
              description: "Your payment has been processed successfully",
            })
          } else {
            onError("Payment was not successful")
          }
        },
        onClose: () => {
          setIsLoading(false)
          onClose?.()
        },
      })

      handler.openIframe()
    } catch (error) {
      setIsLoading(false)
      onError(error instanceof Error ? error.message : "Payment failed")
    }
  }

  return (
    <div onClick={handlePayment} className="inline-block">
      {isLoading ? (
        <Button disabled>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </Button>
      ) : (
        children
      )}
    </div>
  )
}
