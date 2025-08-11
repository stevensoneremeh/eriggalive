"use client"

import React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Eye, EyeOff, Loader2, Crown, Star, Zap, Check, AlertCircle, Wifi, WifiOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DynamicLogo } from "@/components/dynamic-logo"
import { PaystackIntegration } from "@/components/paystack/paystack-integration"
import { motion, AnimatePresence } from "framer-motion"

type UserTier = "grassroot" | "pioneer" | "elder"

interface TierOption {
  id: UserTier
  name: string
  price: number
  description: string
  features: string[]
  icon: any
  color: string
  popular?: boolean
}

const tierOptions: TierOption[] = [
  {
    id: "grassroot",
    name: "Grassroot",
    price: 0,
    description: "Perfect for getting started",
    features: ["Basic community access", "Limited content", "Standard support"],
    icon: Star,
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "pioneer",
    name: "Pioneer",
    price: 2500,
    description: "Enhanced experience for true fans",
    features: ["Full community access", "Exclusive content", "Priority support", "Early access to events"],
    icon: Crown,
    color: "from-purple-500 to-indigo-600",
    popular: true,
  },
  {
    id: "elder",
    name: "Elder",
    price: 5000,
    description: "Ultimate fan experience",
    features: ["All Pioneer features", "VIP event access", "Direct artist interaction", "Exclusive merchandise"],
    icon: Zap,
    color: "from-orange-500 to-red-600",
  },
]

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [selectedTier, setSelectedTier] = useState<UserTier>("grassroot")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)
  const [error, setError] = useState("")
  const [isOnline, setIsOnline] = useState(true)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const { signUp } = useAuth()
  const router = useRouter()

  // Network status monitoring
  const handleOnline = () => setIsOnline(true)
  const handleOffline = () => setIsOnline(false)

  React.useEffect(() => {
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!fullName.trim()) {
      errors.fullName = "Full name is required"
    }

    if (!username.trim()) {
      errors.username = "Username is required"
    } else if (username.length < 3) {
      errors.username = "Username must be at least 3 characters"
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = "Username can only contain letters, numbers, and underscores"
    }

    if (!email.trim()) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address"
    }

    if (!password) {
      errors.password = "Password is required"
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.password = "Password must contain uppercase, lowercase, and number"
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const getErrorMessage = (error: any): string => {
    if (!error) return "An unexpected error occurred"

    const message = error.message || error.toString()

    // Supabase specific errors
    if (message.includes("User already registered")) {
      return "An account with this email already exists. Please sign in instead."
    }
    if (message.includes("Password should be at least")) {
      return "Password is too weak. Please use at least 8 characters with uppercase, lowercase, and numbers."
    }
    if (message.includes("Invalid email")) {
      return "Please enter a valid email address."
    }
    if (message.includes("signup is disabled")) {
      return "Account registration is temporarily disabled. Please try again later."
    }
    if (message.includes("Email rate limit exceeded")) {
      return "Too many signup attempts. Please wait a few minutes before trying again."
    }

    // Network errors
    if (message.includes("fetch") || message.includes("network") || !isOnline) {
      return "Network connection error. Please check your internet connection and try again."
    }

    return message
  }

  const handlePaymentSuccess = async (reference: string) => {
    setIsPaymentProcessing(true)
    try {
      // Process the signup with the selected tier
      const { error } = await signUp(email, password, {
        username,
        full_name: fullName,
        tier: selectedTier,
        payment_reference: reference,
      })

      if (error) {
        setError(getErrorMessage(error))
      } else {
        router.push("/signup/success")
      }
    } catch (err: any) {
      setError(getErrorMessage(err))
    } finally {
      setIsPaymentProcessing(false)
    }
  }

  const handlePaymentError = (error: string) => {
    setError(`Payment failed: ${error}`)
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    if (!isOnline) {
      setError("No internet connection. Please check your network and try again.")
      return
    }

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // For free tier, proceed directly with signup
      if (selectedTier === "grassroot") {
        const { error } = await signUp(email, password, {
          username,
          full_name: fullName,
          tier: selectedTier,
        })

        if (error) {
          setError(getErrorMessage(error))
        } else {
          router.push("/signup/success")
        }
      }
      // For paid tiers, payment will be handled by PaystackIntegration component
    } catch (err: any) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const selectedTierData = tierOptions.find((tier) => tier.id === selectedTier)!

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-0 shadow-2xl">
          <CardHeader className="space-y-1 text-center pb-6">
            <motion.div
              className="flex justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <DynamicLogo className="h-12 w-auto" />
            </motion.div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Join Erigga Live
            </CardTitle>
            <CardDescription className="text-lg">Choose your tier and become part of the community</CardDescription>

            {/* Network Status Indicator */}
            <motion.div
              className="flex items-center justify-center gap-2 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {isOnline ? (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <Wifi className="h-4 w-4" />
                  <span>Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600 text-sm">
                  <WifiOff className="h-4 w-4" />
                  <span>No connection</span>
                </div>
              )}
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Tier Selection */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <Label className="text-base font-semibold mb-4 block">Choose Your Tier</Label>
              <RadioGroup value={selectedTier} onValueChange={(value) => setSelectedTier(value as UserTier)}>
                <div className="grid gap-4">
                  {tierOptions.map((tier) => {
                    const Icon = tier.icon
                    return (
                      <motion.div key={tier.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Label
                          htmlFor={tier.id}
                          className={`relative flex items-start space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedTier === tier.id
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                              : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                          }`}
                        >
                          <RadioGroupItem value={tier.id} id={tier.id} className="mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`p-2 rounded-lg bg-gradient-to-r ${tier.color}`}>
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg">{tier.name}</span>
                                {tier.popular && (
                                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                                    Popular
                                  </Badge>
                                )}
                              </div>
                              <div className="ml-auto">
                                <span className="text-2xl font-bold">
                                  {tier.price === 0 ? "Free" : `₦${tier.price.toLocaleString()}`}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{tier.description}</p>
                            <div className="grid grid-cols-2 gap-2">
                              {tier.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                  <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Label>
                      </motion.div>
                    )
                  })}
                </div>
              </RadioGroup>
            </motion.div>

            {/* Form Fields */}
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      if (validationErrors.fullName) {
                        setValidationErrors((prev) => ({ ...prev, fullName: "" }))
                      }
                    }}
                    disabled={isLoading || isPaymentProcessing}
                    className={validationErrors.fullName ? "border-red-500" : ""}
                  />
                  {validationErrors.fullName && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.fullName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value)
                      if (validationErrors.username) {
                        setValidationErrors((prev) => ({ ...prev, username: "" }))
                      }
                    }}
                    disabled={isLoading || isPaymentProcessing}
                    className={validationErrors.username ? "border-red-500" : ""}
                  />
                  {validationErrors.username && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.username}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (validationErrors.email) {
                      setValidationErrors((prev) => ({ ...prev, email: "" }))
                    }
                  }}
                  disabled={isLoading || isPaymentProcessing}
                  className={validationErrors.email ? "border-red-500" : ""}
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (validationErrors.password) {
                        setValidationErrors((prev) => ({ ...prev, password: "" }))
                      }
                    }}
                    disabled={isLoading || isPaymentProcessing}
                    className={validationErrors.password ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading || isPaymentProcessing}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {validationErrors.password && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.password}
                  </p>
                )}
                <p className="text-xs text-gray-500">Must be 8+ characters with uppercase, lowercase, and numbers</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (validationErrors.confirmPassword) {
                        setValidationErrors((prev) => ({ ...prev, confirmPassword: "" }))
                      }
                    }}
                    disabled={isLoading || isPaymentProcessing}
                    className={validationErrors.confirmPassword ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading || isPaymentProcessing}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              {selectedTier === "grassroot" ? (
                <Button
                  type="submit"
                  className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={isLoading || isPaymentProcessing || !isOnline}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Free Account"
                  )}
                </Button>
              ) : (
                <PaystackIntegration
                  amount={selectedTierData.price}
                  email={email}
                  metadata={{
                    tier: selectedTier,
                    username,
                    full_name: fullName,
                  }}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                >
                  <Button
                    type="submit"
                    className={`w-full h-12 text-lg bg-gradient-to-r ${selectedTierData.color} hover:opacity-90`}
                    disabled={isLoading || isPaymentProcessing || !isOnline || !validateForm()}
                  >
                    {isPaymentProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Pay ₦{selectedTierData.price.toLocaleString()} & Create Account
                        <Crown className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </PaystackIntegration>
              )}
            </motion.form>

            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline underline-offset-4 font-medium">
                  Sign in
                </Link>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
