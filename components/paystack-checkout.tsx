"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { X, CreditCard, Coins } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface Product {
  id: string
  name: string
  price: number
  coin_price: number
  images: string[]
}

interface CartItem {
  product: Product
  size: string
  quantity: number
  paymentMethod: "cash" | "coins"
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

interface PaystackCheckoutProps {
  cart: CartItem[]
  onClose: () => void
  onSuccess: () => void
}

declare global {
  interface Window {
    PaystackPop: any
  }
}

export function PaystackCheckout({ cart, onClose, onSuccess }: PaystackCheckoutProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<"info" | "payment">("info")
  const [loading, setLoading] = useState(false)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
  })

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://js.paystack.co/v1/inline.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // Calculate totals
  const totals = cart.reduce(
    (acc, item) => {
      const itemTotal =
        item.paymentMethod === "cash" ? item.product.price * item.quantity : item.product.coin_price * item.quantity

      if (item.paymentMethod === "cash") {
        acc.cashTotal += itemTotal
      } else {
        acc.coinTotal += itemTotal
      }

      return acc
    },
    { cashTotal: 0, coinTotal: 0 },
  )

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    const required = ["firstName", "lastName", "email", "phone", "address", "city", "state"]
    const missing = required.filter((field) => !customerInfo[field as keyof CustomerInfo])

    if (missing.length > 0) {
      toast({
        title: "Missing Information",
        description: `Please fill in: ${missing.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    // Validate Nigerian phone number
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$/
    if (!phoneRegex.test(customerInfo.phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Nigerian phone number",
        variant: "destructive",
      })
      return
    }

    setStep("payment")
  }

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to complete your purchase",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Process coin payments first
      if (totals.coinTotal > 0) {
        const coinResponse = await fetch("/api/merch/coin-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cart: cart.filter((item) => item.paymentMethod === "coins"),
            customerInfo,
            userId: user.id,
          }),
        })

        if (!coinResponse.ok) {
          const error = await coinResponse.json()
          throw new Error(error.error || "Coin payment failed")
        }
      }

      // Process cash payments with Paystack
      if (totals.cashTotal > 0) {
        if (!window.PaystackPop) {
          throw new Error("Paystack not loaded")
        }

        const handler = window.PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: customerInfo.email,
          amount: totals.cashTotal * 100, // Convert to kobo
          currency: "NGN",
          ref: `erigga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  reference: response.reference,
                  cart: cart.filter((item) => item.paymentMethod === "cash"),
                  customerInfo,
                  userId: user.id,
                }),
              })

              if (!verifyResponse.ok) {
                throw new Error("Payment verification failed")
              }

              toast({
                title: "Payment Successful!",
                description: "Your order has been placed successfully.",
              })

              onSuccess()
            } catch (error) {
              console.error("Payment verification error:", error)
              toast({
                title: "Payment Error",
                description: "Payment completed but verification failed. Please contact support.",
                variant: "destructive",
              })
            }
          },
          onClose: () => {
            setLoading(false)
          },
        })

        handler.openIframe()
      } else {
        // Only coin payments
        toast({
          title: "Payment Successful!",
          description: "Your order has been placed successfully.",
        })
        onSuccess()
      }
    } catch (error: any) {
      console.error("Payment error:", error)
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="bg-gray-900 border-gray-800 text-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{step === "info" ? "Customer Information" : "Payment"}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === "info" ? (
            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={customerInfo.firstName}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={customerInfo.lastName}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+234 or 0"
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo((prev) => ({ ...prev, address: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={customerInfo.city}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, city: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={customerInfo.state}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, state: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                Continue to Payment
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Order Summary */}
              <div>
                <h3 className="font-semibold mb-4">Order Summary</h3>
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.product.name} ({item.size}) x{item.quantity}
                      </span>
                      <span>
                        {item.paymentMethod === "cash"
                          ? `₦${(item.product.price * item.quantity).toLocaleString()}`
                          : `${(item.product.coin_price * item.quantity).toLocaleString()} coins`}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator className="bg-gray-700 my-4" />

                <div className="space-y-2">
                  {totals.cashTotal > 0 && (
                    <div className="flex justify-between font-semibold">
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Cash Total:
                      </span>
                      <span>₦{totals.cashTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {totals.coinTotal > 0 && (
                    <div className="flex justify-between font-semibold">
                      <span className="flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        Coin Total:
                      </span>
                      <span>{totals.coinTotal.toLocaleString()} coins</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Info Summary */}
              <div>
                <h3 className="font-semibold mb-2">Delivery Information</h3>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>
                    {customerInfo.firstName} {customerInfo.lastName}
                  </p>
                  <p>{customerInfo.email}</p>
                  <p>{customerInfo.phone}</p>
                  <p>{customerInfo.address}</p>
                  <p>
                    {customerInfo.city}, {customerInfo.state}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep("info")} className="flex-1">
                  Back
                </Button>
                <Button onClick={handlePayment} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
                  {loading ? "Processing..." : "Complete Payment"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
