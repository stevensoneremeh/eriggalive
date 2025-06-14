"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Coins, CreditCard, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CoinPurchaseEnhancedProps {
  onSuccess?: () => void
}

const COIN_PACKAGES = [
  { coins: 1000, naira: 500, popular: false },
  { coins: 2000, naira: 1000, popular: true, bonus: 100 },
  { coins: 5000, naira: 2500, popular: false, bonus: 300 },
  { coins: 10000, naira: 5000, popular: false, bonus: 700 },
]

export function CoinPurchaseEnhanced({ onSuccess }: CoinPurchaseEnhancedProps) {
  const { profile } = useAuth()
  const [selectedPackage, setSelectedPackage] = useState(COIN_PACKAGES[1])
  const [customCoins, setCustomCoins] = useState("")
  const [isCustom, setIsCustom] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load Paystack script
  useEffect(() => {
    if (typeof window !== "undefined" && !window.PaystackPop) {
      const script = document.createElement("script")
      script.src = "https://js.paystack.co/v1/inline.js"
      script.async = true
      document.body.appendChild(script)

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script)
        }
      }
    }
  }, [])

  const calculateNaira = (coins: number) => coins * 0.5

  const handlePurchase = async () => {
    setError(null)
    setSuccess(null)
    setIsProcessing(true)

    try {
      const coins = isCustom ? Number.parseInt(customCoins, 10) : selectedPackage.coins + (selectedPackage.bonus || 0)
      const baseCoins = isCustom ? Number.parseInt(customCoins, 10) : selectedPackage.coins
      const nairaAmount = calculateNaira(baseCoins)

      if (isNaN(coins) || coins <= 0) {
        setError("Please enter a valid amount")
        setIsProcessing(false)
        return
      }

      if (coins < 100) {
        setError("Minimum purchase is 100 Erigga Coins")
        setIsProcessing(false)
        return
      }

      // Initialize Paystack payment
      if (typeof window !== "undefined" && window.PaystackPop) {
        const handler = window.PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_0123456789abcdef0123456789abcdef01234567",
          email: profile?.email || "user@example.com",
          amount: nairaAmount * 100, // Convert to kobo
          currency: "NGN",
          ref: `erigga_coins_${Date.now()}`,
          metadata: {
            coin_amount: coins,
            base_coins: baseCoins,
            bonus_coins: selectedPackage.bonus || 0,
            user_id: profile?.id || "guest",
          },
          callback: async (response: any) => {
            try {
              // Verify payment on backend
              const verifyResponse = await fetch("/api/coins/purchase", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer mock-token`, // In production, use real JWT
                },
                body: JSON.stringify({
                  reference: response.reference,
                  amount: nairaAmount,
                  coins: coins,
                }),
              })

              const result = await verifyResponse.json()

              if (result.success) {
                setSuccess(`Successfully purchased ${coins} Erigga Coins!`)
                if (onSuccess) onSuccess()
              } else {
                setError(result.error || "Payment verification failed")
              }
            } catch (err) {
              setError("Failed to verify payment")
            } finally {
              setIsProcessing(false)
            }
          },
          onClose: () => {
            setIsProcessing(false)
          },
        })

        handler.openIframe()
      } else {
        setError("Payment gateway not available")
        setIsProcessing(false)
      }
    } catch (err) {
      console.error("Error processing purchase:", err)
      setError("An error occurred while processing your purchase")
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Purchase Erigga Coins</h2>
        <p className="text-muted-foreground">Exchange Rate: 1000 Coins = ₦500</p>
      </div>

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

      {!isCustom ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COIN_PACKAGES.map((pkg) => (
            <Card
              key={pkg.coins}
              className={`cursor-pointer transition-all relative ${
                selectedPackage.coins === pkg.coins
                  ? "border-orange-500 bg-orange-500/10"
                  : "hover:border-orange-500/50"
              }`}
              onClick={() => setSelectedPackage(pkg)}
            >
              {pkg.popular && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Coins className="h-5 w-5 text-yellow-500 mr-2" />
                    <span>{pkg.coins.toLocaleString()} Coins</span>
                  </div>
                  <span className="text-lg font-bold">₦{pkg.naira}</span>
                </CardTitle>
                {pkg.bonus && (
                  <CardDescription className="text-green-600 font-medium">+{pkg.bonus} Bonus Coins!</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Total: {(pkg.coins + (pkg.bonus || 0)).toLocaleString()} coins
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Custom Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-coins">Number of Coins</Label>
              <Input
                id="custom-coins"
                type="number"
                min="100"
                placeholder="Enter amount (min. 100 coins)"
                value={customCoins}
                onChange={(e) => setCustomCoins(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Cost: ₦{isNaN(Number.parseInt(customCoins, 10)) ? 0 : calculateNaira(Number.parseInt(customCoins, 10))}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button variant={!isCustom ? "default" : "outline"} onClick={() => setIsCustom(false)} className="flex-1">
          Packages
        </Button>
        <Button variant={isCustom ? "default" : "outline"} onClick={() => setIsCustom(true)} className="flex-1">
          Custom Amount
        </Button>
      </div>

      <Button
        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        onClick={handlePurchase}
        disabled={isProcessing || (isCustom && (!customCoins || Number.parseInt(customCoins, 10) < 100))}
      >
        <CreditCard className="h-4 w-4 mr-2" />
        {isProcessing ? "Processing..." : `Pay with Paystack`}
      </Button>

      <div className="text-xs text-muted-foreground text-center">
        Secure payment powered by Paystack. Your payment information is encrypted and secure.
      </div>
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
