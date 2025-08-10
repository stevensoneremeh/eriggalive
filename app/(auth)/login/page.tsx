"use client"

import type React from "react"
import { SignIn } from "@clerk/nextjs"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { signIn, user } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message || "An error occurred during login")
      setLoading(false)
    }
    // Don't set loading to false on success - let the auth context handle the redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary: "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600",
            card: "shadow-2xl",
            headerTitle: "text-2xl font-bold",
            headerSubtitle: "text-gray-600 dark:text-gray-400",
          },
        }}
        redirectUrl="/dashboard"
      />
    </div>
  )
}
