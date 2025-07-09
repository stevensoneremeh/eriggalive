"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { Loader2, CreditCard, Coins } from "lucide-react"

interface CartItem {
  product: {
    id: string
    name: string
    price: number
    coin_price: number
  }
  size: string
  quantity: number
  paymentMethod: "cash" | "coins"
}

interface PaystackCheckoutProps {
  cart: CartItem[]
  onSuccess: () => void
}

interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (options: any) => {
        openIframe: () => void
      }
    }
  }
}

export function PaystackCheckout({ cart, onSuccess }: PaystackCheckoutProps) {
  const { user, userProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"info" | "payment">("info")
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
  })

  const cashItems = cart.filter((item) => item.paymentMethod === "cash")
  const coinItems = cart.filter((item) => item.paymentMethod === "coins")

  const cashTotal = cashItems.reduce((total, item) => total + item.product.price * item.quantity, 0)
  const coinTotal = coinItems.reduce((total, item) => total + item.product.coin_price * item.quantity, 0)

  const validateCustomerInfo = () => {
    const required = ["firstName", "lastName", "email", "phone", "address", "city", "state"]
    for (const field of required) {
      if (!customerInfo[field as keyof CustomerInfo]) {
        toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`)
        return false
      }
    }

    // Validate Nigerian phone number
    const phoneRegex = /^(\+234|234|0)[789][01]\d{8}$/
    if (!phoneRegex.test(customerInfo.phone.replace(/\s/g, ""))) {
      toast.error("Please enter a valid Nigerian phone number")
      return false
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerInfo.email)) {
      toast.error("Please enter a valid email address")
      return false
    }

    return true
  }

  const processCoinPayment = async () => {
    if (coinItems.length === 0) return true

    try {
      const response = await fetch("/api/merch/coin-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: coinItems,
          customerInfo,
          totalCoins: coinTotal,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Coin payment failed")
      }

      return result.success
    } catch (error) {
      console.error("Coin payment error:", error)
      toast.error(error instanceof Error ? error.message : "Coin payment failed")
      return false
    }
  }

  const initializePaystackPayment = () => {
    if (cashTotal === 0) return Promise.resolve(true)

    return new Promise((resolve, reject) => {
      const reference = `erigga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: customerInfo.email,
        amount: cashTotal * 100, // Paystack expects amount in kobo
        currency: "NGN",
        ref: reference,
        metadata: {
          custom_fields: [
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: `${customerInfo.firstName} ${customerInfo.lastName}`,
            },
            {
              display_name: "Phone Number",
              variable_name: "phone_number",
              value: customerInfo.phone,
            },
          ],
        },
        callback: async (response: any) => {
          try {
            // Verify payment on server
            const verifyResponse = await fetch("/api/merch/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                reference: response.reference,
                items: cashItems,
                customerInfo,
                totalAmount: cashTotal,
              }),
            })

            const verifyResult = await verifyResponse.json()

            if (verifyResponse.ok && verifyResult.success) {
              resolve(true)
            } else {
              reject(new Error(verifyResult.error || "Payment verification failed"))
            }
          } catch (error) {
            reject(error)
          }
        },
        onClose: () => {
          reject(new Error("Payment cancelled"))
        },
      })

      handler.openIframe()
    })
  }

  const handleCheckout = async () => {
    if (!user) {
      toast.error("Please sign in to checkout")
      return
    }

    if (step === "info") {
      if (!validateCustomerInfo()) return
      setStep("payment")
      return
    }

    setLoading(true)

    try {
      // Process coin payment first
      if (coinItems.length > 0) {
        const coinSuccess = await processCoinPayment()
        if (!coinSuccess) {
          setLoading(false)
          return
        }
      }

      // Process cash payment if there are cash items
      if (cashItems.length > 0) {
        await initializePaystackPayment()
      }

      toast.success("Order completed successfully!")
      onSuccess()
    } catch (error) {
      console.error("Checkout error:", error)
      toast.error(error instanceof Error ? error.message : "Checkout failed")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }))
  }

  if (cart.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {step === "info" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={customerInfo.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={customerInfo.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={customerInfo.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="e.g., +234 801 234 5678"
              />
            </div>

            <div>
              <Label htmlFor="address">Delivery Address *</Label>
              <Input
                id="address"
                value={customerInfo.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter full address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={customerInfo.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={customerInfo.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  placeholder="Enter state"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "payment" && (
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cashItems.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Cash Payment Items
                </h4>
                {cashItems.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.product.name} ({item.size}) x{item.quantity}
                    </span>
                    <span>₦{(item.product.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-medium mt-2">
                  <span>Cash Total:</span>
                  <span>₦{cashTotal.toLocaleString()}</span>
                </div>
              </div>
            )}

            {coinItems.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Coin Payment Items
                </h4>
                {coinItems.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.product.name} ({item.size}) x{item.quantity}
                    </span>
                    <span>{item.product.coin_price * item.quantity} coins</span>
                  </div>
                ))}
                <div className="flex justify-between font-medium mt-2">
                  <span>Coin Total:</span>
                  <span>{coinTotal} coins</span>
                </div>
                <div className="text-sm text-muted-foreground">Your balance: {userProfile?.coins || 0} coins</div>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <Button onClick={() => setStep("info")} variant="outline" className="w-full">
                Back to Customer Info
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleCheckout}
        disabled={loading || coinTotal > (userProfile?.coins || 0)}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : step === "info" ? (
          "Continue to Payment"
        ) : (
          `Complete Order${cashTotal > 0 ? ` - ₦${cashTotal.toLocaleString()}` : ""}${coinTotal > 0 ? ` + ${coinTotal} coins` : ""}`
        )}
      </Button>

      {coinTotal > (userProfile?.coins || 0) && (
        <p className="text-sm text-destructive text-center">
          Insufficient coins. You need {coinTotal - (userProfile?.coins || 0)} more coins.
        </p>
      )}

      <script src="https://js.paystack.co/v1/inline.js"></script>
    </div>
  )
}
