"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Eye, EyeOff, User, Crown, Building, Coins } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

declare global {
  interface Window {
    PaystackPop: any
  }
}

const TIER_PRICES = {
  FREE: {
    monthly: 0,
    quarterly: 0,
    annually: 0,
  },
  PRO: {
    monthly: 9900, // ₦9,900 (discounted from ₦10,000)
    quarterly: 29700, // ₦29,700 (₦9,900 × 3 - ₦300 discount)
    annually: 118800, // ₦118,800 (₦9,900 × 12 - ₦1,000 discount)
  },
  ENT: {
    annually: 119900, // ₦119,900 (annual only, ends in 9)
  },
}

const TIER_FEATURES = {
  FREE: ["Access to basic content", "Community participation", "Basic profile features", "Limited downloads"],
  PRO: [
    "All Free features",
    "Premium content access",
    "Priority support",
    "Unlimited downloads",
    "Exclusive events access",
    "1,000 Erigga Coins per month",
  ],
  ENT: [
    "All Pro features",
    "VIP community access",
    "Direct artist interaction",
    "Early content access",
    "Merchandise discounts",
    "Meet & greet opportunities",
    "12,000 Erigga Coins bonus",
    "Gold dashboard theme",
  ],
}

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    fullName: "",
    tier: "FREE",
    interval: "monthly",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://js.paystack.co/v1/inline.js"
    script.async = true
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.username || !formData.fullName) {
      setError("All fields are required")
      return false
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }

    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters long")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address")
      return false
    }

    return true
  }

  const handlePaystackPayment = (amount: number, tier: string, interval: string) => {
    return new Promise((resolve, reject) => {
      if (!window.PaystackPop) {
        reject(new Error("Paystack not loaded"))
        return
      }

      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_your_key_here",
        email: formData.email,
        amount: amount * 100, // Convert to kobo
        currency: "NGN",
        ref: `erigga_${tier}_${interval}_${Date.now()}`,
        metadata: {
          tier: tier,
          interval: interval,
          username: formData.username,
          full_name: formData.fullName,
        },
        callback: (response: any) => {
          resolve(response.reference)
        },
        onClose: () => {
          reject(new Error("Payment cancelled"))
        },
      })

      handler.openIframe()
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError("")

    try {
      let paymentReference = undefined

      // Handle payment for paid tiers
      if (formData.tier !== "FREE") {
        const tierPrices = TIER_PRICES[formData.tier as keyof typeof TIER_PRICES]
        const amount = tierPrices[formData.interval as keyof typeof tierPrices] || 0

        if (amount > 0) {
          setPaymentLoading(true)
          try {
            paymentReference = (await handlePaystackPayment(amount, formData.tier, formData.interval)) as string
          } catch (paymentError: any) {
            setError(paymentError.message || "Payment failed")
            setPaymentLoading(false)
            setIsLoading(false)
            return
          }
          setPaymentLoading(false)
        }
      }

      // Create account
      const { error } = await signUp(formData.email, formData.password, {
        username: formData.username,
        full_name: formData.fullName,
        tier: formData.tier,
        interval: formData.interval,
        payment_reference: paymentReference,
      })

      if (error) {
        setError(error.message || "Failed to create account")
      } else {
        // Success - redirect will be handled by auth context
        router.push("/dashboard")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
      setPaymentLoading(false)
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "FREE":
        return <User className="h-5 w-5" />
      case "PRO":
        return <Crown className="h-5 w-5" />
      case "ENT":
        return <Building className="h-5 w-5" />
      default:
        return <User className="h-5 w-5" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "FREE":
        return "border-gray-500/30 bg-gray-500/10"
      case "PRO":
        return "border-blue-500/30 bg-blue-500/10"
      case "ENT":
        return "border-yellow-500/30 bg-yellow-500/10"
      default:
        return "border-gray-500/30 bg-gray-500/10"
    }
  }

  const getCurrentPrice = () => {
    if (formData.tier === "FREE") return 0
    const tierPrices = TIER_PRICES[formData.tier as keyof typeof TIER_PRICES]
    return tierPrices[formData.interval as keyof typeof tierPrices] || 0
  }

  const getOriginalPrice = () => {
    if (formData.tier === "FREE") return 0
    if (formData.tier === "PRO") {
      switch (formData.interval) {
        case "monthly":
          return 10000
        case "quarterly":
          return 30000
        case "annually":
          return 120000
        default:
          return 0
      }
    }
    return getCurrentPrice()
  }

  const getCoinsBonus = () => {
    if (formData.tier === "FREE") return 0
    if (formData.tier === "PRO") {
      switch (formData.interval) {
        case "monthly":
          return 1000
        case "quarterly":
          return 3000
        case "annually":
          return 12000
        default:
          return 0
      }
    }
    if (formData.tier === "ENT") return 12000
    return 0
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-10" />

      <Card className="w-full max-w-2xl relative z-10 bg-black/40 backdrop-blur-xl border-purple-500/20">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Join EriggaLive
          </CardTitle>
          <CardDescription className="text-center text-gray-300">
            Create your account and choose your membership tier
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-red-500/20 bg-red-500/10">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-200">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  required
                  className="bg-black/20 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-200">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  required
                  className="bg-black/20 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                className="bg-black/20 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                    className="bg-black/20 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-200">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    required
                    className="bg-black/20 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Tier Selection */}
            <div className="space-y-4">
              <Label className="text-gray-200 text-lg font-semibold">Choose Your Membership Tier</Label>
              <RadioGroup
                value={formData.tier}
                onValueChange={(value) => handleInputChange("tier", value)}
                className="grid grid-cols-1 gap-4"
              >
                {Object.entries(TIER_PRICES).map(([tier, prices]) => (
                  <div key={tier} className="flex items-center space-x-2">
                    <RadioGroupItem value={tier} id={tier} className="text-purple-400" />
                    <Label
                      htmlFor={tier}
                      className={`flex-1 cursor-pointer rounded-lg border p-4 transition-all ${
                        formData.tier === tier ? getTierColor(tier) : "border-gray-600/30 bg-gray-800/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getTierIcon(tier)}
                          <div>
                            <div className="font-semibold text-white">
                              {tier === "FREE"
                                ? "ECor Erigga Citizen"
                                : tier === "PRO"
                                  ? "Erigga Indigen"
                                  : "Enterprise (E)"}
                            </div>
                            <div className="text-sm text-gray-400">
                              {TIER_FEATURES[tier as keyof typeof TIER_FEATURES].slice(0, 2).join(", ")}
                            </div>
                          </div>
                        </div>
                        {tier !== "FREE" && (
                          <div className="text-right">
                            <div className="text-lg font-bold text-purple-400">
                              {tier === "ENT" ? "₦119,900" : "From ₦9,900"}
                            </div>
                            <div className="text-xs text-gray-400">{tier === "ENT" ? "annual only" : "per month"}</div>
                          </div>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {formData.tier === "PRO" && (
                <div className="space-y-2">
                  <Label className="text-gray-200">Billing Interval</Label>
                  <Select value={formData.interval} onValueChange={(value) => handleInputChange("interval", value)}>
                    <SelectTrigger className="bg-black/20 border-purple-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">
                        Monthly - <span className="line-through text-gray-400">₦10,000</span> ₦9,900
                      </SelectItem>
                      <SelectItem value="quarterly">
                        Quarterly - ₦29,700 <span className="text-green-400">(Save ₦300)</span>
                      </SelectItem>
                      <SelectItem value="annually">
                        Annually - ₦118,800 <span className="text-green-400">(Save ₦1,000)</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.tier !== "FREE" && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300">Price:</span>
                    <div className="text-right">
                      {getOriginalPrice() > getCurrentPrice() && (
                        <span className="line-through text-gray-400 text-sm mr-2">
                          ₦{getOriginalPrice().toLocaleString()}
                        </span>
                      )}
                      <span className="text-xl font-bold text-purple-400">₦{getCurrentPrice().toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 flex items-center">
                      <Coins className="h-4 w-4 mr-1 text-yellow-400" />
                      Coins Bonus:
                    </span>
                    <span className="text-yellow-400 font-semibold">{getCoinsBonus().toLocaleString()} coins</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              disabled={isLoading || paymentLoading}
            >
              {paymentLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  {formData.tier === "FREE"
                    ? "Create Free Account"
                    : `Pay ₦${getCurrentPrice().toLocaleString()} & Create Account`}
                </>
              )}
            </Button>

            <p className="text-center text-sm text-gray-300">
              Already have an account?{" "}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
