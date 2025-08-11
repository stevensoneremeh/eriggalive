"use client"

import React, { useState, useCallback, useMemo, useEffect } from "react"
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

type UserTier = "free" | "pro" | "enterprise"

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
    id: "free",
    name: "Free",
    price: 0,
    description: "Perfect for getting started",
    features: ["Basic community access", "Limited content", "Standard support"],
    icon: Star,
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "pro",
    name: "Pro",
    price: 2500,
    description: "Enhanced experience for true fans",
    features: ["Full community access", "Exclusive content", "Priority support", "Early access to events"],
    icon: Crown,
    color: "from-purple-500 to-indigo-600",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 5000,
    description: "Ultimate fan experience",
    features: ["All Pro features", "VIP event access", "Direct artist interaction", "Exclusive merchandise"],
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
  const [selectedTier, setSelectedTier] = useState<UserTier>("free")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)
  const [error, setError] = useState("")
  const [isOnline, setIsOnline] = useState(true)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const { signUp } = useAuth()
  const router = useRouter()

  // Memoized validation function to prevent unnecessary re-renders
  const validateForm = useCallback(() => {
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

    return errors
  }, [fullName, username, email, password, confirmPassword])

  // Memoized error message generator
  const getErrorMessage = useCallback((error: any): string => {
    if (!error) return "An unexpected error occurred"

    const message = error.message || error.toString()

    // Existing error handling logic
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
  }, [isOnline])

  // Network status monitoring with useEffect
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Memoized submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isOnline) {
      setError("No internet connection. Please check your network and try again.")
      return
    }

    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // For free tier, proceed directly with signup
      if (selectedTier === "free") {
        const { error } = await signUp(email, password, {
          username,
          full_name: fullName,
          tier: selectedTier,
        })

        if (error) {
          setError(getErrorMessage(error))
        }
        // Success handling is done in the auth context
      }
      // For paid tiers, payment will be handled by PaystackIntegration component
    } catch (err: any) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [
    isOnline, 
    email, 
    password, 
    username, 
    fullName, 
    selectedTier, 
    signUp, 
    validateForm, 
    getErrorMessage
  ])

  // Memoized selected tier data
  const selectedTierData = useMemo(() => 
    tierOptions.find((tier) => tier.id === selectedTier)!, 
    [selectedTier]
  )

  // Rest of the component remains the same as your original implementation
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {/* ... [rest of your original JSX remains unchanged] ... */}
    </div>
  )
}
