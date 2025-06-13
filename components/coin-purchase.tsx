"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Coins, CreditCard, Bitcoin, Zap } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEffect } from "react"

interface CoinPurchaseProps {
  onSuccess?: () => void
}

const COIN_PACKAGES = [
  { amount: 100, price: 1000, bonus: 0 },
  { amount: 500, price: 4500, bonus: 50 },
  { amount: 1000, price: 8000, bonus: 200 },
  { amount: 5000, price: 35000, bonus: 1500 },
]

export function CoinPurchase({ onSuccess }: CoinPurchaseProps) {
  const { profile, isPreviewMode } = useAuth()
  const [selectedPackage, setSelectedPackage] = useState(COIN_PACKAGES[1])
  const [customAmount, setCustomAmount] = useState("")
  const [isCustom, setIsCustom] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "crypto" | "preview_instant">(
    isPreviewMode ? "preview_instant" : "paystack",
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load Paystack script properly
  useEffect(() => {
    if (typeof window !== "undefined" && !isPreviewMode && !window.PaystackPop) {
      const script = document.createElement("script")
      script.src = "https://js.paystack.co/v1/inline.js"
      script.async = true
      document.body.appendChild(script)

      return () => {
        document.body.removeChild(script)
      }
    }
  }, [isPreviewMode])

  const handlePurchase = async () => {
    setError(null)
    setSuccess(null)
    setIsProcessing(true)

    try {
      const amount = isCustom ? Number.parseInt(customAmount, 10) : selectedPackage.amount

      if (isNaN(amount) || amount <= 0) {
        setError("Please enter a valid amount")
        setIsProcessing(false)
        return
      }

      // Handle preview mode instant purchase
      if (isPreviewMode && paymentMethod === "preview_instant") {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setSuccess(`Successfully added ${amount} coins to your account!`)
        if (onSuccess) onSuccess()
        setIsProcessing(false)
        return
      }

      if (paymentMethod === "paystack") {
        // In preview mode, simulate a successful payment
        if (isPreviewMode) {
          setTimeout(() => {
            setSuccess(`Successfully purchased ${amount} coins!`)
            if (onSuccess) onSuccess()
            setIsProcessing(false)
          }, 1500)
          return
        }

        // For production, use the Paystack API
        if (typeof window !== "undefined" && window.PaystackPop) {
          const handler = window.PaystackPop.setup({
            key: "pk_test_0123456789abcdef0123456789abcdef01234567", // Replace with actual key
            email: profile?.email || "user@example.com",
            amount: isCustom ? amount * 10 * 100 : selectedPackage.price * 100, // Convert to kobo
            currency: "NGN",
            ref: `coins_${Date.now()}`,
            metadata: {
              coin_amount: amount,
            },
            callback: (response: any) => {
              console.log("Payment successful:", response)
              setSuccess(`Successfully purchased ${amount} coins!`)
              if (onSuccess) onSuccess()
              setIsProcessing(false)
            },
            onClose: () => {
              console.log("Payment window closed")
              setIsProcessing(false)
            },
          })

          handler.openIframe()
        } else {
          setError("Payment gateway not available")
          setIsProcessing(false)
        }
      } else if (paymentMethod === "crypto") {
        // For crypto, show crypto payment instructions
        setTimeout(() => {
          setSuccess(`Crypto payment initiated for ${amount} coins. Check your wallet for confirmation.`)
          if (onSuccess) onSuccess()
          setIsProcessing(false)
        }, 1500)
      }
    } catch (err) {
      console.error("Error processing purchase:", err)
      setError("An error occurred while processing your purchase")
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {isPreviewMode && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-800">
            Running in preview mode. Coin purchases will be simulated.
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <form id="paystack-payment-form" onSubmit={(e) => e.preventDefault()}>
        <Tabs defaultValue="packages" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="packages" onClick={() => setIsCustom(false)}>
              Packages
            </TabsTrigger>
            <TabsTrigger value="custom" onClick={() => setIsCustom(true)}>
              Custom Amount
            </TabsTrigger>
          </TabsList>

          <TabsContent value="packages" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {COIN_PACKAGES.map((pkg) => (
                <div
                  key={pkg.amount}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPackage.amount === pkg.amount
                      ? "border-orange-500 bg-orange-500/10"
                      : "hover:border-orange-500/50"
                  }`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Coins className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="font-bold">{pkg.amount}</span>
                    </div>
                    <div className="text-sm font-medium">₦{pkg.price.toLocaleString()}</div>
                  </div>
                  {pkg.bonus > 0 && <div className="text-xs text-green-500 font-medium">+{pkg.bonus} bonus coins!</div>}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-amount">Enter amount of coins</Label>
              <Input
                id="custom-amount"
                type="number"
                min="10"
                placeholder="Enter amount (min. 10 coins)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Price: ₦{isNaN(Number.parseInt(customAmount, 10)) ? 0 : Number.parseInt(customAmount, 10) * 10}
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 mt-4">
          <div>
            <Label>Payment Method</Label>
            <RadioGroup
              defaultValue={isPreviewMode ? "preview_instant" : "paystack"}
              className="grid grid-cols-2 gap-4 pt-2"
              onValueChange={(value) => setPaymentMethod(value as "paystack" | "crypto" | "preview_instant")}
            >
              {isPreviewMode && (
                <div
                  className={`border rounded-lg p-4 cursor-pointer ${
                    paymentMethod === "preview_instant" ? "border-orange-500 bg-orange-500/10" : ""
                  }`}
                >
                  <RadioGroupItem value="preview_instant" id="preview_instant" className="sr-only" />
                  <Label htmlFor="preview_instant" className="flex items-center cursor-pointer">
                    <Zap className="h-5 w-5 mr-2 text-purple-500" />
                    <span>Instant (Preview)</span>
                  </Label>
                </div>
              )}

              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  paymentMethod === "paystack" ? "border-orange-500 bg-orange-500/10" : ""
                }`}
              >
                <RadioGroupItem value="paystack" id="paystack" className="sr-only" />
                <Label htmlFor="paystack" className="flex items-center cursor-pointer">
                  <CreditCard className="h-5 w-5 mr-2" />
                  <span>Paystack</span>
                </Label>
              </div>

              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  paymentMethod === "crypto" ? "border-orange-500 bg-orange-500/10" : ""
                }`}
              >
                <RadioGroupItem value="crypto" id="crypto" className="sr-only" />
                <Label htmlFor="crypto" className="flex items-center cursor-pointer">
                  <Bitcoin className="h-5 w-5 mr-2" />
                  <span>Crypto</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="button"
            className="w-full bg-orange-500 hover:bg-orange-600 text-black"
            onClick={handlePurchase}
            disabled={isProcessing || (isCustom && (!customAmount || Number.parseInt(customAmount, 10) < 10))}
          >
            {isProcessing ? "Processing..." : `Purchase ${isCustom ? customAmount : selectedPackage.amount} Coins`}
          </Button>
        </div>
      </form>
    </div>
  )
}

// Add TypeScript declaration for PaystackPop
declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: any) => {
        openIframe: () => void
      }
    }
  }
}
