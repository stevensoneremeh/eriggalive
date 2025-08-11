"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Eye, EyeOff, Check, Crown, Building } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { signUp } from "@/lib/actions"

const TIER_PRICES = {
  grassroot: 0,
  pioneer: 2000,
  elder: 5000,
  blood_brotherhood: 10000,
}

const TIER_FEATURES = {
  grassroot: ["Community access", "Public content", "Event announcements", "Basic profile"],
  pioneer: [
    "All Grassroot features",
    "Early music releases",
    "Exclusive interviews",
    "Discounted merch",
    "Pioneer badge",
  ],
  elder: [
    "All Pioneer features",
    "Behind-the-scenes content",
    "Studio session videos",
    "Priority event access",
    "Monthly Erigga coins",
    "Elder badge",
  ],
  blood_brotherhood: [
    "All Elder features",
    "Direct messaging with Erigga",
    "Virtual meet & greets",
    "Exclusive merchandise",
    "Blood Brotherhood badge",
    "Voting rights on new content",
  ],
}

function SubmitButton({ tier }: { tier: string }) {
  const { pending } = useFormStatus()
  const price = TIER_PRICES[tier as keyof typeof TIER_PRICES]

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating Account...
        </>
      ) : (
        <>{price === 0 ? "Create Free Account" : `Create Account - ₦${price.toLocaleString()}`}</>
      )}
    </Button>
  )
}

export default function SignUpForm() {
  const [state, formAction] = useActionState(signUp, null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedTier, setSelectedTier] = useState("grassroot")

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "grassroot":
        return <Check className="h-5 w-5" />
      case "pioneer":
        return <Crown className="h-5 w-5" />
      case "elder":
        return <Building className="h-5 w-5" />
      case "blood_brotherhood":
        return <Crown className="h-5 w-5 text-red-500" />
      default:
        return <Check className="h-5 w-5" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "grassroot":
        return "border-green-500/30 bg-green-500/10"
      case "pioneer":
        return "border-blue-500/30 bg-blue-500/10"
      case "elder":
        return "border-purple-500/30 bg-purple-500/10"
      case "blood_brotherhood":
        return "border-red-500/30 bg-red-500/10"
      default:
        return "border-gray-500/30 bg-gray-500/10"
    }
  }

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

      <form action={formAction}>
        <CardContent className="space-y-6">
          {state?.error && (
            <Alert className="border-red-500/20 bg-red-500/10">
              <AlertDescription className="text-red-400">{state.error}</AlertDescription>
            </Alert>
          )}

          {state?.success && (
            <Alert className="border-green-500/20 bg-green-500/10">
              <AlertDescription className="text-green-400">{state.success}</AlertDescription>
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
                            {tier.replace("_", " ")} {price > 0 && `- ₦${price.toLocaleString()}`}
                          </div>
                          <div className="text-sm text-gray-400">
                            {TIER_FEATURES[tier as keyof typeof TIER_FEATURES].slice(0, 2).join(", ")}
                          </div>
                        </div>
                      </div>
                      {price > 0 && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-purple-400">₦{price.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">monthly</div>
                        </div>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <SubmitButton tier={selectedTier} />

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
