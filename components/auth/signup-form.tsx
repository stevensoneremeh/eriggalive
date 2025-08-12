"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Eye, EyeOff, Check, Crown, Zap, DollarSign } from "lucide-react"
import Link from "next/link"
import { signUp } from "@/lib/actions"
import { PaystackIntegration } from "@/components/paystack/paystack-integration"
import { useRouter } from "next/navigation"

const TIER_PRICES = {
  free: 0,
  premium: 5000, // ₦5,000 monthly
  enterprise: 0, // Custom pricing from $200+
}

const TIER_FEATURES = {
  free: ["Community access", "Public content", "Event announcements", "Basic profile"],
  premium: [
    "All Free features",
    "Early music releases",
    "Exclusive interviews",
    "Behind-the-scenes content",
    "Studio session videos",
    "Priority event access",
    "Monthly Erigga coins",
    "Premium badge",
  ],
  enterprise: [
    "All Premium features",
    "Custom pricing from $200+",
    "Direct messaging with Erigga",
    "Virtual meet & greets",
    "Exclusive merchandise",
    "Dedicated account manager",
    "Custom integrations",
    "Priority support",
    "Enterprise badge",
    "Bulk user management",
    "Voting rights on new content",
  ],
}

export default function SignUpForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedTier, setSelectedTier] = useState("free") // Default to free tier
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentReference, setPaymentReference] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData | null>(null)
  const [enterpriseAmount, setEnterpriseAmount] = useState("")

  const getEnterpriseAmountInNaira = () => {
    const usdAmount = Number.parseFloat(enterpriseAmount)
    if (isNaN(usdAmount) || usdAmount < 200) return 0
    // Convert USD to Naira (approximate rate: 1 USD = 1000 NGN)
    return Math.round(usdAmount * 1000)
  }

  const getTierPrice = () => {
    if (selectedTier === "enterprise") {
      return getEnterpriseAmountInNaira()
    }
    return TIER_PRICES[selectedTier as keyof typeof TIER_PRICES]
  }

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    setSuccess(null)

    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (selectedTier === "enterprise") {
      const usdAmount = Number.parseFloat(enterpriseAmount)
      if (isNaN(usdAmount) || usdAmount < 200) {
        setError("Enterprise tier requires a minimum of $200")
        return
      }
    }

    const tierPrice = getTierPrice()

    if (tierPrice === 0) {
      startTransition(async () => {
        try {
          const result = await signUp(null, formData)
          if (result?.error) {
            setError(result.error)
          } else if (result?.success) {
            setSuccess("Account created successfully! Redirecting to dashboard...")
            setTimeout(() => {
              router.push(result.redirect || "/dashboard")
            }, 2000)
          }
        } catch (err) {
          setError("An unexpected error occurred. Please try again.")
        }
      })
    } else {
      setFormData(formData)
      // Payment will be handled by PaystackIntegration component
    }
  }

  const handlePaymentSuccess = async (reference: string) => {
    setPaymentReference(reference)
    setIsProcessingPayment(true)

    if (!formData) {
      setError("Form data not found. Please try again.")
      setIsProcessingPayment(false)
      return
    }

    formData.append("paymentReference", reference)
    formData.append("tierPrice", getTierPrice().toString())
    if (selectedTier === "enterprise") {
      formData.append("enterpriseAmountUSD", enterpriseAmount)
    }

    startTransition(async () => {
      try {
        const result = await signUp(null, formData)
        if (result?.error) {
          setError(result.error)
        } else if (result?.success) {
          setSuccess("Payment successful! Account created. Redirecting to dashboard...")
          // Use the redirect from server action if available
          setTimeout(() => {
            router.push(result.redirect || "/dashboard")
          }, 2000)
        }
      } catch (err) {
        setError("Account creation failed after payment. Please contact support.")
      } finally {
        setIsProcessingPayment(false)
      }
    })
  }

  const handlePaymentError = (error: string) => {
    setError(`Payment failed: ${error}`)
    setFormData(null)
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "free":
        return <Check className="h-5 w-5" />
      case "premium":
        return <Crown className="h-5 w-5" />
      case "enterprise":
        return <Zap className="h-5 w-5 text-purple-500" />
      default:
        return <Check className="h-5 w-5" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "free":
        return "border-green-500/30 bg-green-500/10"
      case "premium":
        return "border-blue-500/30 bg-blue-500/10"
      case "enterprise":
        return "border-purple-600/30 bg-purple-600/10"
      default:
        return "border-gray-500/30 bg-gray-500/10"
    }
  }

  const tierPrice = getTierPrice()
  const needsPayment = tierPrice > 0

  return (
    <Card className="w-full max-w-2xl relative z-10 bg-black/40 backdrop-blur-xl border-purple-500/20">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Join EriggaLive
        </CardTitle>
        <CardDescription className="text-center text-gray-300">
          Create your account and choose your tier
        </CardDescription>
      </CardHeader>

      <form action={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-500/20 bg-red-500/10">
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500/20 bg-green-500/10">
              <AlertDescription className="text-green-400">{success}</AlertDescription>
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
                name="fullName"
                type="text"
                placeholder="Enter your full name"
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
                name="username"
                type="text"
                placeholder="Choose a username"
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
              name="email"
              type="email"
              placeholder="Enter your email"
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
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
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
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
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
            <Label className="text-gray-200 text-lg font-semibold">Choose Your Tier</Label>
            <RadioGroup
              name="tier"
              value={selectedTier}
              onValueChange={setSelectedTier}
              className="grid grid-cols-1 gap-4"
            >
              {Object.entries(TIER_PRICES).map(([tier, price]) => (
                <div key={tier} className="flex items-center space-x-2">
                  <RadioGroupItem value={tier} id={tier} className="text-purple-400" />
                  <Label
                    htmlFor={tier}
                    className={`flex-1 cursor-pointer rounded-lg border p-4 transition-all ${
                      selectedTier === tier ? getTierColor(tier) : "border-gray-600/30 bg-gray-800/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getTierIcon(tier)}
                        <div>
                          <div className="font-semibold text-white capitalize">
                            {tier}
                            {tier !== "enterprise" && price > 0 && ` - ₦${price.toLocaleString()}`}
                            {tier === "enterprise" && " - Custom Pricing"}
                          </div>
                          <div className="text-sm text-gray-400">
                            {TIER_FEATURES[tier as keyof typeof TIER_FEATURES].slice(0, 2).join(", ")}
                          </div>
                        </div>
                      </div>
                      {tier !== "enterprise" && price > 0 && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-purple-400">₦{price.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">monthly</div>
                        </div>
                      )}
                      {tier === "enterprise" && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-purple-400">Custom</div>
                          <div className="text-xs text-gray-400">from $200+</div>
                        </div>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {selectedTier === "enterprise" && (
              <div className="space-y-2">
                <Label htmlFor="enterpriseAmount" className="text-gray-200">
                  Enterprise Amount (USD)
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="enterpriseAmount"
                    type="number"
                    min="200"
                    step="1"
                    placeholder="Enter amount (minimum $200)"
                    value={enterpriseAmount}
                    onChange={(e) => setEnterpriseAmount(e.target.value)}
                    className="bg-black/20 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400 pl-10"
                  />
                </div>
                {enterpriseAmount && Number.parseFloat(enterpriseAmount) >= 200 && (
                  <div className="text-sm text-gray-300">
                    Equivalent: ₦{getEnterpriseAmountInNaira().toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          {!needsPayment ? (
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Free Account"
              )}
            </Button>
          ) : (
            <div className="w-full space-y-4">
              <Button
                type="submit"
                disabled={
                  isPending ||
                  isProcessingPayment ||
                  (selectedTier === "enterprise" && (!enterpriseAmount || Number.parseFloat(enterpriseAmount) < 200))
                }
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                {isPending || isProcessingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isProcessingPayment ? "Processing Payment..." : "Preparing Payment..."}
                  </>
                ) : (
                  `Pay ₦${tierPrice.toLocaleString()} & Create Account`
                )}
              </Button>

              {formData && (
                <PaystackIntegration
                  amount={tierPrice}
                  email={formData.get("email") as string}
                  metadata={{
                    tier: selectedTier,
                    fullName: formData.get("fullName") as string,
                    username: formData.get("username") as string,
                    signup_type: "tier_subscription",
                    ...(selectedTier === "enterprise" && { enterpriseAmountUSD: enterpriseAmount }),
                  }}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                >
                  <div />
                </PaystackIntegration>
              )}
            </div>
          )}

          <p className="text-center text-sm text-gray-300">
            Already have an account?{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
