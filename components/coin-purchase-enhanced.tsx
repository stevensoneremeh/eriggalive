"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { CreditCard, AlertCircle, CheckCircle, Loader2, Shield, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

interface CoinPurchaseEnhancedProps {
  onSuccess?: (transaction: any) => void
  onError?: (error: string) => void
}

const COIN_PACKAGES = [
  { coins: 1000, naira: 500, popular: false, id: "basic" },
  { coins: 2000, naira: 1000, popular: true, bonus: 100, id: "popular" },
  { coins: 5000, naira: 2500, popular: false, bonus: 300, id: "premium" },
  { coins: 10000, naira: 5000, popular: false, bonus: 700, id: "ultimate" },
]

// Validation functions
const validateCoinAmount = (amount: number): string | null => {
  if (isNaN(amount) || amount <= 0) return "Please enter a valid amount"
  if (amount < 100) return "Minimum purchase is 100 Erigga Coins"
  if (amount > 100000) return "Maximum purchase is 100,000 Erigga Coins per transaction"
  return null
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function CoinPurchaseEnhanced({ onSuccess, onError }: CoinPurchaseEnhancedProps) {
  const { profile, refreshSession, user } = useAuth()
  const { toast } = useToast()
  const [selectedPackage, setSelectedPackage] = useState(COIN_PACKAGES[1])
  const [customCoins, setCustomCoins] = useState("")
  const [isCustom, setIsCustom] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [paymentAttempts, setPaymentAttempts] = useState(0)
  const [isPaystackLoaded, setIsPaystackLoaded] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // Check if we're in preview mode
  useEffect(() => {
    const checkPreviewMode = () => {
      const isPreview =
        process.env.NODE_ENV === "development" ||
        window.location.hostname.includes("vercel.app") ||
        window.location.hostname.includes("localhost")
      setIsPreviewMode(isPreview)
    }

    checkPreviewMode()
  }, [])

  // Load Paystack script with error handling
  useEffect(() => {
    const loadPaystack = () => {
      try {
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
            console.log("Paystack loaded successfully")
          }

          script.onerror = () => {
            setError("Failed to load payment gateway. Please refresh the page.")
            console.error("Failed to load Paystack script")
          }

          document.head.appendChild(script)
        }
      } catch (err) {
        console.error("Error loading Paystack:", err)
        setError("Payment gateway initialization failed")
      }
    }

    loadPaystack()
  }, [])

  const calculateNaira = useCallback((coins: number) => coins * 0.5, [])

  const resetState = useCallback(() => {
    setError(null)
    setSuccess(null)
  }, [])

  const verifyPayment = useCallback(
    async (reference: string, expectedAmount: number, expectedCoins: number) => {
      try {
        const authToken = user?.access_token || "mock-token"

        const response = await fetch("/api/coins/purchase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            reference,
            amount: expectedAmount,
            coins: expectedCoins,
            userId: profile?.id,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          // Handle different error types
          let errorMessage = result.error || "Payment verification failed"

          switch (result.code) {
            case "AUTH_ERROR":
              errorMessage = "Please log in to complete your purchase"
              break
            case "VALIDATION_ERROR":
              errorMessage = `Validation failed: ${result.error}`
              break
            case "PAYMENT_FAILED":
              errorMessage = "Payment was not successful. Please try again."
              break
            case "AMOUNT_MISMATCH":
              errorMessage = "Payment amount doesn't match. Please contact support."
              break
            case "VERIFICATION_ERROR":
              errorMessage = "Unable to verify payment. Please contact support if money was deducted."
              break
            case "CONFIG_ERROR":
              errorMessage = "Payment system configuration error. Please try again later."
              break
            case "DUPLICATE_TRANSACTION":
              errorMessage = "This transaction has already been processed."
              break
            default:
              errorMessage = result.error || `Payment verification failed (${response.status})`
          }

          throw new Error(errorMessage)
        }

        if (!result.success) {
          throw new Error(result.error || "Payment verification failed")
        }

        return result
      } catch (err) {
        console.error("Payment verification error:", err)
        throw err
      }
    },
    [profile, user],
  )

  const handlePaymentSuccess = useCallback(
    async (response: any, totalCoins: number, nairaAmount: number) => {
      try {
        console.log("Payment successful:", response)

        const verificationResult = await verifyPayment(response.reference, nairaAmount, totalCoins)

        setSuccess(`Successfully purchased ${totalCoins.toLocaleString()} Erigga Coins!`)

        toast({
          title: "Purchase Successful!",
          description: `${totalCoins.toLocaleString()} Erigga Coins added to your account`,
          duration: 5000,
        })

        if (refreshSession) {
          await refreshSession()
        }

        if (onSuccess) {
          onSuccess(verificationResult.transaction)
        }

        // Reset form
        setCustomCoins("")
        setIsCustom(false)
        setSelectedPackage(COIN_PACKAGES[1])
        setPaymentAttempts(0)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Payment verification failed"
        setError(errorMessage)

        toast({
          title: "Payment Verification Failed",
          description: errorMessage,
          variant: "destructive",
          duration: 8000,
        })

        if (onError) {
          onError(errorMessage)
        }
      } finally {
        setIsProcessing(false)
      }
    },
    [verifyPayment, refreshSession, onSuccess, onError, toast],
  )

  const handlePaymentClose = useCallback(() => {
    console.log("Payment dialog closed")
    setIsProcessing(false)
  }, [])

  const handlePurchaseValidation = useCallback(() => {
    resetState()

    if (!profile?.email) {
      setError("Please log in to purchase coins")
      return false
    }

    if (!validateEmail(profile.email)) {
      setError("Invalid email address in profile")
      return false
    }

    if (!isPaystackLoaded) {
      setError("Payment gateway not ready. Please wait a moment and try again.")
      return false
    }

    const coins = isCustom ? Number.parseInt(customCoins, 10) : selectedPackage.coins + (selectedPackage.bonus || 0)
    const validationError = validateCoinAmount(isCustom ? Number.parseInt(customCoins, 10) : selectedPackage.coins)

    if (validationError) {
      setError(validationError)
      return false
    }

    if (paymentAttempts >= 3) {
      setError("Too many payment attempts. Please wait 5 minutes before trying again.")
      return false
    }

    return true
  }, [profile, isPaystackLoaded, isCustom, customCoins, selectedPackage, paymentAttempts, resetState])

  const handlePurchase = useCallback(async () => {
    if (!handlePurchaseValidation()) return

    setIsProcessing(true)
    setPaymentAttempts((prev) => prev + 1)

    try {
      const baseCoins = isCustom ? Number.parseInt(customCoins, 10) : selectedPackage.coins
      const bonusCoins = isCustom ? 0 : selectedPackage.bonus || 0
      const totalCoins = baseCoins + bonusCoins
      const nairaAmount = calculateNaira(baseCoins)

      const paymentReference = `erigga_coins_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      if (typeof window !== "undefined" && window.PaystackPop) {
        // Create the configuration object with proper function references
        const paystackConfig = {
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_0123456789abcdef0123456789abcdef01234567",
          email: profile?.email || "",
          amount: Math.round(nairaAmount * 100), // Convert to kobo and ensure integer
          currency: "NGN",
          ref: paymentReference,
          metadata: {
            coin_amount: totalCoins,
            base_coins: baseCoins,
            bonus_coins: bonusCoins,
            user_id: profile?.id || "guest",
            package_id: isCustom ? "custom" : selectedPackage.id,
            timestamp: new Date().toISOString(),
            preview_mode: isPreviewMode,
          },
          callback: (response: any) => {
            handlePaymentSuccess(response, totalCoins, nairaAmount)
          },
          onClose: () => {
            handlePaymentClose()
          },
        }

        const handler = window.PaystackPop.setup(paystackConfig)
        handler.openIframe()
      } else {
        throw new Error("Payment gateway not available")
      }
    } catch (err) {
      console.error("Error processing purchase:", err)
      const errorMessage = err instanceof Error ? err.message : "An error occurred while processing your purchase"
      setError(errorMessage)

      toast({
        title: "Purchase Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })

      if (onError) {
        onError(errorMessage)
      }
      setIsProcessing(false)
    }
  }, [
    handlePurchaseValidation,
    isCustom,
    customCoins,
    selectedPackage,
    calculateNaira,
    profile,
    handlePaymentSuccess,
    handlePaymentClose,
    onError,
    toast,
    isPreviewMode,
  ])

  const isFormValid = isCustom
    ? customCoins && Number.parseInt(customCoins, 10) >= 100 && Number.parseInt(customCoins, 10) <= 100000
    : selectedPackage

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Purchase Erigga Coins</h2>
        <p className="text-muted-foreground">Exchange Rate: 1000 Coins = ₦500</p>
        <div className="flex items-center justify-center mt-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 mr-1" />
          Secure payment powered by Paystack
        </div>
      </div>

      {isPreviewMode && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>Preview Mode: Payments will be simulated for testing purposes.</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isPaystackLoaded && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Loading payment gateway...</AlertDescription>
        </Alert>
      )}

      {/* ... existing code for package selection and custom amount ... */}

      <Button
        className="w-full bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
        onClick={handlePurchase}
        disabled={isProcessing || !isFormValid || !isPaystackLoaded}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            {isPreviewMode ? "Simulate Payment" : "Pay"} ₦
            {isCustom
              ? customCoins
                ? calculateNaira(Number.parseInt(customCoins, 10)).toLocaleString()
                : "0"
              : selectedPackage.naira.toLocaleString()}
          </>
        )}
      </Button>

      {paymentAttempts > 0 && (
        <div className="text-xs text-muted-foreground text-center">Payment attempts: {paymentAttempts}/3</div>
      )}

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>Your payment information is encrypted and secure.</p>
        <p>Coins will be added to your account immediately after successful payment.</p>
        {isPreviewMode && <p className="text-orange-600 font-medium">Preview mode: No real money will be charged.</p>}
      </div>
    </div>
  )
}

// Add TypeScript declaration for PaystackPop
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
