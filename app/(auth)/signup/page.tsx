"use client"

import React, { useState, useCallback, useMemo } from "react"
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
  const [formState, setFormState] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    fullName: "",
    selectedTier: "free" as UserTier,
    showPassword: false,
    showConfirmPassword: false,
    isLoading: false,
    isPaymentProcessing: false,
    error: "",
    isOnline: true,
    validationErrors: {} as Record<string, string>
  })

  const { signUp } = useAuth()
  const router = useRouter()

  // Memoized update function to reduce unnecessary renders
  const updateFormState = useCallback((updates: Partial<typeof formState>) => {
    setFormState(prev => ({
      ...prev,
      ...updates
    }))
  }, [])

  // Network status monitoring
  React.useEffect(() => {
    const handleOnline = () => updateFormState({ isOnline: true })
    const handleOffline = () => updateFormState({ isOnline: false })

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [updateFormState])

  // Memoized validation function
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {}

    const {
      fullName, username, email, password, confirmPassword
    } = formState

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
  }, [formState.fullName, formState.username, formState.email, 
      formState.password, formState.confirmPassword])

  // Memoized error message generation
  const getErrorMessage = useCallback((error: any): string => {
    if (!error) return "An unexpected error occurred"

    const message = error.message || error.toString()

    // Existing error message logic...
    if (message.includes("User already registered")) {
      return "An account with this email already exists. Please sign in instead."
    }
    // ... (rest of the existing error handling)

    return message
  }, [])

  // Handlers with reduced dependencies
  const handleInputChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    updateFormState({ 
      [field]: value,
      validationErrors: { ...formState.validationErrors, [field]: '' }
    })
  }, [updateFormState, formState.validationErrors])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formState.isOnline) {
      updateFormState({ error: "No internet connection. Please check your network and try again." })
      return
    }

    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      updateFormState({ validationErrors })
      return
    }

    updateFormState({ isLoading: true, error: "" })

    try {
      if (formState.selectedTier === "free") {
        const { error } = await signUp(formState.email, formState.password, {
          username: formState.username,
          full_name: formState.fullName,
          tier: formState.selectedTier,
        })

        if (error) {
          updateFormState({ error: getErrorMessage(error) })
        }
      }
    } catch (err: any) {
      updateFormState({ error: getErrorMessage(err) })
    } finally {
      updateFormState({ isLoading: false })
    }
  }, [
    formState.isOnline, 
    formState.email, 
    formState.password, 
    formState.username, 
    formState.fullName, 
    formState.selectedTier,
    signUp,
    updateFormState,
    validateForm,
    getErrorMessage
  ])

  // Memoized selected tier data
  const selectedTierData = useMemo(() => 
    tierOptions.find((tier) => tier.id === formState.selectedTier)!, 
    [formState.selectedTier]
  )

  // Rest of the component remains largely the same...
  return (
    // Your existing JSX, but update state references to use formState
    // For example:
    <Input
      id="email"
      type="email"
      placeholder="Enter your email"
      value={formState.email}
      onChange={handleInputChange('email')}
      disabled={formState.isLoading || formState.isPaymentProcessing}
      className={formState.validationErrors.email ? "border-red-500" : ""}
    />
    // ... similar changes throughout the component
  )
}
