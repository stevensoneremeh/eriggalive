"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { X, CreditCard, Coins, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  price: number
  coin_price: number
}

interface CartItem {
  product: Product
  size: string
  quantity: number
  payment_method: "cash" | "coins"
}

interface CustomerInfo {
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
}

interface PaystackCheckoutProps {
  cart: CartItem[]
  customerInfo: CustomerInfo
  onCustomerInfoChange: (info: CustomerInfo) => void
  onClose: () => void
  onSuccess: () => void
}

declare global {
  interface Window {
    PaystackPop: any
  }
}

export function PaystackCheckout({
  cart,
  customerInfo,
  onCustomerInfoChange,
  onClose,
  onSuccess,
}: PaystackCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"info" | "payment">("info")
  const { toast } = useToast()

  const cashItems = cart.filter((item) => item.payment_method === "cash")
  const coinItems = cart.filter((item) => item.payment_method === "coins")

  const cashTotal = cashItems.reduce((total, item) => total + item.product.price * item.quantity, 0)

  const coinTotal = coinItems.reduce((total, item) => total + item.product.coin_price * item.quantity, 0)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price)
  }

  const validateForm = () => {
    const { name, email, phone, address, city, state } = customerInfo

    if (!name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" })
      return false
    }

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      toast({ title: "Error", description: "Valid email is required", variant: "destructive" })
      return false
    }

    if (!phone.trim() || !/^(\+234|0)[789]\d{9}$/.test(phone.replace(/\s/g, ""))) {
      toast({ title: "Error", description: "Valid Nigerian phone number is required", variant: "destructive" })
      return false
    }

    if (!address.trim()) {
      toast({ title: "Error", description: "Address is required", variant: "destructive" })
      return false
    }

    if (!city.trim()) {
      toast({ title: "Error", description: "City is required", variant: "destructive" })
      return false
    }

    if (!state.trim()) {
      toast({ title: "Error", description: "State is required", variant: "destructive" })
      return false
    }

    return true
  }

  const handleContinueToPayment = () => {
    if (validateForm()) {
      setStep("payment")
    }
  }

  const processCoinPayment = async () => {
    if (coinItems.length === 0) return true

    try {
      const response = await fetch("/api/merch/coin-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: coinItems,
          customer_info: customerInfo,
          total_coins: coinTotal,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Coin payment failed")
      }

      return true
    } catch (error: any) {
      toast({
        title: "Coin Payment Failed",
        description: error.message,
        variant: "destructive",
      })
      return false
    }
  }

  const initializePaystackPayment = () => {
    if (typeof window === "undefined" || !window.PaystackPop) {
      toast({
        title: "Payment Error",
        description: "Paystack is not loaded. Please refresh and try again.",
        variant: "destructive",
      })
      return
    }

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: customerInfo.email,
      amount: cashTotal * 100, // Convert to kobo
      currency: "NGN",
      ref: `erigga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        custom_fields: [
          {
            display_name: "Customer Name",
            variable_name: "customer_name",
            value: customerInfo.name,
          },
          {
            display_name: "Phone Number",
            variable_name: "phone_number",
            value: customerInfo.phone,
          },
        ],
      },
      callback: async (response: any) => {
        setLoading(true)

        try {
          // Verify payment with backend
          const verifyResponse = await fetch("/api/merch/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference: response.reference,
              cash_items: cashItems,
              customer_info: customerInfo,
            }),
          })

          const verifyResult = await verifyResponse.json()

          if (!verifyResponse.ok) {
            throw new Error(verifyResult.error || "Payment verification failed")
          }

          // Process coin payment if there are coin items
          const coinPaymentSuccess = await processCoinPayment()

          if (coinPaymentSuccess) {
            toast({
              title: "Payment Successful!",
              description: "Your order has been placed successfully.",
            })
            onSuccess()
          }
        } catch (error: any) {
          toast({
            title: "Payment Error",
            description: error.message,
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      },
      onClose: () => {
        toast({
          title: "Payment Cancelled",
          description: "Payment was cancelled by user.",
        })
      },
    })

    handler.openIframe()
  }

  const handlePayment = async () => {
    setLoading(true)

    try {
      // If only coin items, process coin payment directly
      if (cashItems.length === 0 && coinItems.length > 0) {
        const success = await processCoinPayment()
        if (success) {
          toast({
            title: "Payment Successful!",
            description: "Your order has been placed successfully.",
          })
          onSuccess()
        }
      }
      // If only cash items or mixed, use Paystack
      else if (cashItems.length > 0) {
        initializePaystackPayment()
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-gray-900 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{step === "info" ? "Customer Information" : "Payment"}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === "info" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) =>
                      onCustomerInfoChange({
                        ...customerInfo,
                        name: e.target.value,
                      })
                    }
                    className="bg-gray-800 border-gray-600 mt-1"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) =>
                      onCustomerInfoChange({
                        ...customerInfo,
                        email: e.target.value,
                      })
                    }
                    className="bg-gray-800 border-gray-600 mt-1"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      onCustomerInfoChange({
                        ...customerInfo,
                        phone: e.target.value,
                      })
                    }
                    className="bg-gray-800 border-gray-600 mt-1"
                    placeholder="+234 or 0 followed by 10 digits"
                  />
                </div>

                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={customerInfo.city}
                    onChange={(e) =>
                      onCustomerInfoChange({
                        ...customerInfo,
                        city: e.target.value,
                      })
                    }
                    className="bg-gray-800 border-gray-600 mt-1"
                    placeholder="Enter your city"
                  />
                </div>

                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={customerInfo.state}
                    onChange={(e) =>
                      onCustomerInfoChange({
                        ...customerInfo,
                        state: e.target.value,
                      })
                    }
                    className="bg-gray-800 border-gray-600 mt-1"
                    placeholder="Enter your state"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Delivery Address *</Label>
                <Textarea
                  id="address"
                  value={customerInfo.address}
                  onChange={(e) =>
                    onCustomerInfoChange({
                      ...customerInfo,
                      address: e.target.value,
                    })
                  }
                  className="bg-gray-800 border-gray-600 mt-1"
                  placeholder="Enter your full delivery address"
                  rows={3}
                />
              </div>

              <Button onClick={handleContinueToPayment} className="w-full bg-green-600 hover:bg-green-700">
                Continue to Payment
              </Button>
            </>
          ) : (
            <>
              {/* Order Summary */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Order Summary</h3>

                {cashItems.length > 0 && (
                  <div>
                    <h4 className="font-medium flex items-center mb-2">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Cash Payment Items
                    </h4>
                    {cashItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm py-1">
                        <span>
                          {item.product.name} ({item.size}) x{item.quantity}
                        </span>
                        <span>{formatPrice(item.product.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {coinItems.length > 0 && (
                  <div>
                    <h4 className="font-medium flex items-center mb-2">
                      <Coins className="w-4 h-4 mr-2" />
                      Coin Payment Items
                    </h4>
                    {coinItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm py-1">
                        <span>
                          {item.product.name} ({item.size}) x{item.quantity}
                        </span>
                        <span className="text-yellow-500">{item.product.coin_price * item.quantity} coins</span>
                      </div>
                    ))}
                  </div>
                )}

                <Separator className="bg-gray-700" />

                <div className="space-y-2">
                  {cashTotal > 0 && (
                    <div className="flex justify-between font-semibold">
                      <span>Cash Total:</span>
                      <span>{formatPrice(cashTotal)}</span>
                    </div>
                  )}
                  {coinTotal > 0 && (
                    <div className="flex justify-between font-semibold">
                      <span>Coin Total:</span>
                      <span className="text-yellow-500">{coinTotal} coins</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setStep("info")} className="flex-1" disabled={loading}>
                  Back
                </Button>
                <Button onClick={handlePayment} className="flex-1 bg-green-600 hover:bg-green-700" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ${cashTotal > 0 ? formatPrice(cashTotal) : ""} ${coinTotal > 0 ? `+ ${coinTotal} coins` : ""}`
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Load Paystack Script */}
      <script src="https://js.paystack.co/v1/inline.js"></script>
    </div>
  )
}
