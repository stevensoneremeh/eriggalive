"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

declare global {
  interface Window {
    PaystackPop: any
  }
}

interface PaystackIntegrationProps {
  amount: number
  email: string
  metadata?: Record<string, any>
  onSuccess: (reference: string) => void
  onError: (error: string) => void
  children?: React.ReactNode
  className?: string
  disabled?: boolean
}

export function PaystackIntegration({
  amount,
  email,
  metadata = {},
  onSuccess,
  onError,
  children,
  className,
  disabled = false,
}: PaystackIntegrationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    // Check if Paystack script is already loaded
    if (window.PaystackPop) {
      setScriptLoaded(true)
      return
    }

    // Load Paystack script
    const script = document.createElement("script")
    script.src = "https://js.paystack.co/v1/inline.js"
    script.async = true
    script.onload = () => setScriptLoaded(true)
    script.onerror = () => {
      console.error("Failed to load Paystack script")
      onError("Failed to load payment system")
    }

    document.body.appendChild(script)

    return () => {
      // Cleanup script if component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [onError])

  const handlePayment = () => {
    if (!scriptLoaded || !window.PaystackPop) {
      onError("Payment system not ready. Please try again.")
      return
    }

    if (!email || !amount) {
      onError("Invalid payment details")
      return
    }

    setIsLoading(true)

    try {
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_your_key_here",
        email: email,
        amount: amount * 100, // Convert to kobo
        currency: "NGN",
        ref: `erigga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          custom_fields: [
            {
              display_name: "Email",
              variable_name: "email",
              value: email,
            },
            ...Object.entries(metadata).map(([key, value]) => ({
              display_name: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
              variable_name: key,
              value: String(value),
            })),
          ],
        },
        callback: (response: any) => {
          setIsLoading(false)
          if (response.status === "success") {
            onSuccess(response.reference)
          } else {
            onError("Payment was not completed")
          }
        },
        onClose: () => {
          setIsLoading(false)
          onError("Payment cancelled")
        },
      })

      handler.openIframe()
    } catch (error: any) {
      setIsLoading(false)
      onError(error.message || "Payment failed")
    }
  }

  if (children) {
    return (
      <div onClick={handlePayment} className={className}>
        {children}
      </div>
    )
  }

  return (
    <Button onClick={handlePayment} disabled={disabled || isLoading || !scriptLoaded} className={className}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        `Pay ₦${amount.toLocaleString()}`
      )}
    </Button>
  )
}
