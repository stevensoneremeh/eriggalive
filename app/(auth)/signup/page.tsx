"use client"

import { Badge } from "@/components/ui/badge"
import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Eye, EyeOff, Check, Coins, Gift, Crown, Star, Zap } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

const TIER_OPTIONS = [
  {
    id: "grassroot",
    name: "Grassroot",
    price: "Free",
    description: "Perfect for new fans",
    features: ["Basic community access", "100 welcome coins", "Standard support"],
    icon: Star,
    color: "from-green-500 to-emerald-500",
    popular: false,
  },
  {
    id: "pioneer",
    name: "Pioneer",
    price: "$9.99/month",
    description: "For dedicated fans",
    features: ["Priority community access", "500 monthly coins", "Exclusive content", "Priority support"],
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
    popular: true,
  },
  {
    id: "elder",
    name: "Elder",
    price: "$19.99/month",
    description: "For super fans",
    features: [
      "VIP community access",
      "1000 monthly coins",
      "Early access to content",
      "Direct artist interaction",
      "VIP support",
    ],
    icon: Crown,
    color: "from-purple-500 to-pink-500",
    popular: false,
  },
]

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [selectedTier, setSelectedTier] = useState("grassroot")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Client-side validation
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    if (!fullName.trim()) {
      setError("Full name is required")
      setLoading(false)
      return
    }

    if (!username.trim()) {
      setError("Username is required")
      setLoading(false)
      return
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters")
      setLoading(false)
      return
    }

    try {
      const { error } = await signUp(email, password, {
        username: username.trim(),
        full_name: fullName.trim(),
        tier: selectedTier,
      })

      if (error) {
        setError(error?.message || "Failed to create account")
      } else {
        setSuccess(true)
        // Redirect to dashboard after showing success message
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const selectedTierData = TIER_OPTIONS.find((tier) => tier.id === selectedTier)

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background to-muted/20">
        <Card className="max-w-lg w-full bg-card/80 backdrop-blur-sm border-green-500/30 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
                <Check className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-bounce">
                <Gift className="h-4 w-4 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Welcome to the Movement!
            </h2>
            <p className="text-muted-foreground mb-6 text-lg">
              Your account has been created successfully, <span className="font-semibold text-primary">{fullName}</span>
              !
            </p>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 mb-6 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center justify-center mb-3">
                <Coins className="h-8 w-8 text-yellow-600 mr-2" />
                <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                  {selectedTier === "grassroot" ? "100" : selectedTier === "pioneer" ? "500" : "1000"} Coins
                </span>
              </div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                🎉 {selectedTierData?.name} Welcome Bonus!
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                Use your coins to unlock exclusive content and participate in community events!
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold mb-3 text-center">Your Account Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="font-medium">@{username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tier:</span>
                  <span className="font-medium capitalize text-primary">{selectedTierData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Starting Coins:</span>
                  <span className="font-medium text-yellow-600">
                    {selectedTier === "grassroot" ? "100" : selectedTier === "pioneer" ? "500" : "1000"} Coins
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Taking you to your dashboard...</span>
            </div>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            >
              Go to Dashboard Now
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Registration form
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="font-bold text-4xl bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
            JOIN THE MOVEMENT
          </h1>
          <p className="text-muted-foreground">Create your Erigga fan account and choose your tier!</p>
        </div>
        <Card className="bg-card/50 border-orange-500/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Sign Up
              <div className="flex items-center text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full">
                <Gift className="h-3 w-3 mr-1" />
                Welcome Bonus
              </div>
            </CardTitle>
            <CardDescription>Join thousands of fans in the Erigga community</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a unique username"
                    required
                    className="bg-background/50"
                    minLength={3}
                  />
                  <p className="text-xs text-muted-foreground">Minimum 3 characters</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="bg-background/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      required
                      className="bg-background/50 pr-10"
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      className="bg-background/50 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tier Selection */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Choose Your Tier</Label>
                <RadioGroup value={selectedTier} onValueChange={setSelectedTier} className="space-y-3">
                  {TIER_OPTIONS.map((tier) => {
                    const Icon = tier.icon
                    return (
                      <div key={tier.id} className="relative">
                        <RadioGroupItem value={tier.id} id={tier.id} className="sr-only" />
                        <Label
                          htmlFor={tier.id}
                          className={cn(
                            "flex items-start space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200",
                            selectedTier === tier.id
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-border hover:border-primary/50 hover:bg-accent/50",
                          )}
                        >
                          <div className={cn("p-2 rounded-full bg-gradient-to-r", tier.color)}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                {tier.name}
                                {tier.popular && <Badge className="bg-orange-500 text-white text-xs">Popular</Badge>}
                              </h3>
                              <span className="font-bold text-primary">{tier.price}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{tier.description}</p>
                            <ul className="space-y-1">
                              {tier.features.map((feature, index) => (
                                <li key={index} className="text-sm flex items-center gap-2">
                                  <Check className="h-3 w-3 text-green-500" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </Label>
                      </div>
                    )
                  })}
                </RadioGroup>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating your account...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-4 w-4" />
                    Create Account & Get{" "}
                    {selectedTier === "grassroot" ? "100" : selectedTier === "pioneer" ? "500" : "1000"} Coins
                  </>
                )}
              </Button>
            </form>

            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-orange-500 hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
              <p className="text-xs text-muted-foreground">
                By creating an account, you agree to our{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
