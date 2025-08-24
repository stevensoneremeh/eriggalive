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
import { Loader2, Eye, EyeOff, Check, Crown, Building, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMembershipTiers } from "@/hooks/useMembership"
import { getMembershipPricing, formatPrice, isMembershipFeatureEnabled } from "@/lib/membership"
import type { MembershipTierCode, BillingInterval } from "@/lib/membership"
import { generateMembershipReference } from "@/lib/paystack"

declare global {
  interface Window {
    PaystackPop: any
  }
}

const LEGACY_TIER_PRICES = {
  free: 0,
  pro: 2500, // ₦2,500
  enterprise: 5000, // ₦5,000
}

const TIER_FEATURES = {
  FREE: ["Access to basic content", "Community participation", "Basic profile features", "Limited downloads"],
  PRO: [
    "All Free features",
    "Premium content access",
    "Priority support",
    "Unlimited downloads",
    "Exclusive events access",
    "1,000 coins per month",
  ],
  ENT: [
    "All Pro features",
    "VIP community access",
    "Direct artist interaction",
    "Early content access",
    "Merchandise discounts",
    "Meet & greet opportunities",
    "Custom gold dashboard",
    "12,000 coins annually",
  ],
}

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    fullName: "",
    tier: "FREE" as MembershipTierCode,
    billingInterval: "monthly" as BillingInterval,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const { tiers, isLoading: tiersLoading } = useMembershipTiers()
  const membershipEnabled = isMembershipFeatureEnabled()

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://js.paystack.co/v1/inline.js"
    script.async = true
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
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

  const handleMembershipPayment = async (tierCode: MembershipTierCode, interval: BillingInterval) => {
    const pricing = getMembershipPricing(tierCode, interval)
    if (!pricing) {
      throw new Error("Invalid tier or billing interval")
    }

    return new Promise((resolve, reject) => {
      if (!window.PaystackPop) {
        reject(new Error("Paystack not loaded"))
        return
      }

      const reference = generateMembershipReference(tierCode, formData.email)

      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_your_key_here",
        email: formData.email,
        amount: pricing.amount_ngn * 100, // Convert to kobo
        currency: "NGN",
        ref: reference,
        metadata: {
          purchase_type: "membership",
          tier_code: tierCode,
          interval: interval,
          months_purchased: pricing.months,
          username: formData.username,
          full_name: formData.fullName,
          user_id: formData.email, // Will be updated after user creation
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

      if (membershipEnabled && formData.tier !== "FREE") {
        setPaymentLoading(true)
        try {
          paymentReference = (await handleMembershipPayment(formData.tier, formData.billingInterval)) as string
        } catch (paymentError: any) {
          setError(paymentError.message || "Payment failed")
          setPaymentLoading(false)
          setIsLoading(false)
          return
        }
        setPaymentLoading(false)
      }

      // Create account
      const { error } = await signUp(formData.email, formData.password, {
        username: formData.username,
        full_name: formData.fullName,
        tier: membershipEnabled ? formData.tier : "free", // Use legacy tier for backward compatibility
        membership_tier: membershipEnabled ? formData.tier : undefined,
        billing_interval: membershipEnabled ? formData.billingInterval : undefined,
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

  const getTierIcon = (tier: MembershipTierCode) => {
    switch (tier) {
      case "FREE":
        return <Users className="h-5 w-5" />
      case "PRO":
        return <Crown className="h-5 w-5" />
      case "ENT":
        return <Building className="h-5 w-5" />
      default:
        return <Check className="h-5 w-5" />
    }
  }

  const getTierColor = (tier: MembershipTierCode) => {
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

  const getCurrentPricing = () => {
    if (!membershipEnabled || formData.tier === "FREE") {
      return null
    }
    return getMembershipPricing(formData.tier, formData.billingInterval)
  }

  const currentPricing = getCurrentPricing()

  const getAvailableBillingOptions = (tierCode: MembershipTierCode): BillingInterval[] => {
    if (tierCode === "FREE") return []
    if (tierCode === "PRO") return ["monthly", "quarterly", "annually"]
    if (tierCode === "ENT") return ["annually"]
    return []
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

            <div className="space-y-4">
              <Label className="text-gray-200 text-lg font-semibold">Choose Your Membership Tier</Label>

              {membershipEnabled && !tiersLoading ? (
                <RadioGroup
                  value={formData.tier}
                  onValueChange={(value) => handleInputChange("tier", value)}
                  className="grid grid-cols-1 gap-4"
                >
                  {(["FREE", "PRO", "ENT"] as MembershipTierCode[]).map((tierCode) => {
                    const pricing = getMembershipPricing(tierCode, formData.billingInterval)
                    return (
                      <div key={tierCode} className="flex items-center space-x-2">
                        <RadioGroupItem value={tierCode} id={tierCode} className="text-purple-400" />
                        <Label
                          htmlFor={tierCode}
                          className={`flex-1 cursor-pointer rounded-lg border p-4 transition-all ${
                            formData.tier === tierCode ? getTierColor(tierCode) : "border-gray-600/30 bg-gray-800/20"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getTierIcon(tierCode)}
                              <div>
                                <div className="font-semibold text-white">
                                  {tierCode === "FREE"
                                    ? "ECor Erigga Citizen"
                                    : tierCode === "PRO"
                                      ? "Erigga Indigen"
                                      : "Enterprise"}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {TIER_FEATURES[tierCode].slice(0, 2).join(", ")}
                                </div>
                              </div>
                            </div>
                            {pricing && (
                              <div className="text-right">
                                <div className="text-lg font-bold text-purple-400">
                                  {formatPrice(pricing.amount_ngn)}
                                </div>
                                {pricing.original_price && pricing.original_price > pricing.amount_ngn && (
                                  <div className="text-xs text-gray-400 line-through">
                                    {formatPrice(pricing.original_price)}
                                  </div>
                                )}
                                <div className="text-xs text-gray-400">
                                  {pricing.coins_bonus.toLocaleString()} coins
                                </div>
                              </div>
                            )}
                          </div>
                        </Label>
                      </div>
                    )
                  })}
                </RadioGroup>
              ) : (
                // Fallback to legacy tier system
                <RadioGroup
                  value={formData.tier === "FREE" ? "free" : formData.tier === "PRO" ? "pro" : "enterprise"}
                  onValueChange={(value) =>
                    handleInputChange("tier", value === "free" ? "FREE" : value === "pro" ? "PRO" : "ENT")
                  }
                  className="grid grid-cols-1 gap-4"
                >
                  {Object.entries(LEGACY_TIER_PRICES).map(([tier, price]) => (
                    <div key={tier} className="flex items-center space-x-2">
                      <RadioGroupItem value={tier} id={tier} className="text-purple-400" />
                      <Label
                        htmlFor={tier}
                        className={`flex-1 cursor-pointer rounded-lg border p-4 transition-all ${
                          (formData.tier === "FREE" ? "free" : formData.tier === "PRO" ? "pro" : "enterprise") === tier
                            ? getTierColor(tier.toUpperCase() as MembershipTierCode)
                            : "border-gray-600/30 bg-gray-800/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getTierIcon(tier.toUpperCase() as MembershipTierCode)}
                            <div>
                              <div className="font-semibold text-white capitalize">
                                {tier} {price > 0 && `- ₦${price.toLocaleString()}`}
                              </div>
                              <div className="text-sm text-gray-400">
                                {TIER_FEATURES[tier.toUpperCase() as MembershipTierCode].slice(0, 2).join(", ")}
                              </div>
                            </div>
                          </div>
                          {price > 0 && (
                            <div className="text-right">
                              <div className="text-lg font-bold text-purple-400">₦{price.toLocaleString()}</div>
                              <div className="text-xs text-gray-400">one-time</div>
                            </div>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {membershipEnabled && formData.tier !== "FREE" && (
                <div className="space-y-2">
                  <Label className="text-gray-200">Billing Interval</Label>
                  <Select
                    value={formData.billingInterval}
                    onValueChange={(value) => handleInputChange("billingInterval", value)}
                  >
                    <SelectTrigger className="bg-black/20 border-purple-500/30 text-white">
                      <SelectValue placeholder="Select billing interval" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-purple-500/30">
                      {getAvailableBillingOptions(formData.tier).map((interval) => {
                        const pricing = getMembershipPricing(formData.tier, interval)
                        return (
                          <SelectItem key={interval} value={interval} className="text-white hover:bg-purple-500/20">
                            <div className="flex items-center justify-between w-full">
                              <span className="capitalize">{interval}</span>
                              {pricing && (
                                <div className="ml-4 text-right">
                                  {pricing.original_price && pricing.original_price > pricing.amount_ngn && (
                                    <span className="text-xs text-gray-400 line-through mr-2">
                                      {formatPrice(pricing.original_price)}
                                    </span>
                                  )}
                                  <span className="text-purple-400 font-semibold">
                                    {formatPrice(pricing.amount_ngn)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>

                  {/* Show pricing details */}
                  {currentPricing && (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <div className="text-sm text-gray-300">
                        <div className="flex justify-between items-center">
                          <span>Duration:</span>
                          <span>
                            {currentPricing.months} month{currentPricing.months > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Coin Bonus:</span>
                          <span className="text-yellow-400">{currentPricing.coins_bonus.toLocaleString()} coins</span>
                        </div>
                        {currentPricing.discount_amount && currentPricing.discount_amount > 0 && (
                          <div className="flex justify-between items-center text-green-400">
                            <span>Savings:</span>
                            <span>{formatPrice(currentPricing.discount_amount)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              disabled={isLoading || paymentLoading || tiersLoading}
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
                    : currentPricing
                      ? `Pay ${formatPrice(currentPricing.amount_ngn)} & Create Account`
                      : `Pay & Create Account`}
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
