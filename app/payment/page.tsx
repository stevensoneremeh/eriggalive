"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Star, CreditCard, ArrowLeft, Check } from "lucide-react"
import { toast } from "sonner"

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const tier = searchParams.get("tier")
  const billing = searchParams.get("billing")
  const amount = searchParams.get("amount")

  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const getTierInfo = (tierValue: string) => {
    switch (tierValue) {
      case "pro":
        return {
          name: "Pro",
          label: "Erigga Indigen",
          icon: <Star className="w-6 h-6 text-blue-600" />,
          color: "border-blue-200 bg-blue-50",
        }
      case "enterprise":
        return {
          name: "Enterprise",
          label: "E",
          icon: <Crown className="w-6 h-6 text-yellow-600" />,
          color: "border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100",
        }
      default:
        return null
    }
  }

  const handlePaystackPayment = async () => {
    if (!user || !amount) return

    setLoading(true)

    try {
      const response = await fetch("/api/membership/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          billing_interval: billing,
          amount: Number.parseFloat(amount),
          user_id: user.id,
          email: user.email,
        }),
      })

      const data = await response.json()

      if (data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        toast.error("Failed to initialize payment")
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast.error("Payment initialization failed")
    } finally {
      setLoading(false)
    }
  }

  const tierInfo = getTierInfo(tier || "")

  if (!tierInfo || !amount) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p>Invalid payment parameters</p>
            <Button onClick={() => router.push("/signup")} className="mt-4">
              Back to Signup
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Complete Your Payment</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Upgrade to {tierInfo.label} membership</p>
        </div>

        <Card className={tierInfo.color}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {tierInfo.icon}
                <div>
                  <CardTitle>{tierInfo.name} Membership</CardTitle>
                  <CardDescription>{tierInfo.label}</CardDescription>
                </div>
              </div>
              <Badge className="bg-blue-500 text-white">{billing} billing</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold">Payment Summary</h3>
              <div className="flex justify-between">
                <span>
                  {tierInfo.name} Membership ({billing})
                </span>
                <span className="font-semibold">₦{Number.parseFloat(amount).toLocaleString()}</span>
              </div>
              {tier === "pro" && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Monthly coin bonus</span>
                  <span>+1,000 coins</span>
                </div>
              )}
              {tier === "enterprise" && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Annual coin bonus</span>
                  <span>+12,000 coins</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₦{Number.parseFloat(amount).toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-4">
              <h3 className="font-semibold">Payment Method</h3>

              <Button
                onClick={handlePaystackPayment}
                disabled={loading}
                className="w-full h-12 bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {loading ? "Processing..." : "Pay with Paystack"}
              </Button>

              <div className="text-center text-sm text-gray-500">Secure payment powered by Paystack</div>
            </div>

            {/* Features Reminder */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium mb-2">What you'll get:</h4>
              <div className="space-y-1 text-sm">
                {tier === "pro" && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Premium chat rooms</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Exclusive content access</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>1,000 coins per month</span>
                    </div>
                  </>
                )}
                {tier === "enterprise" && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>VIP access to all content</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Custom gold dashboard</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>12,000 coins annually</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Button variant="outline" onClick={() => router.push("/signup")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Signup
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
