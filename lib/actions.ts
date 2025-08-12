"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function verifyPaystackPayment(reference: string, expectedAmount: number) {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

  if (!paystackSecretKey) {
    // In development/preview mode, simulate successful verification
    if (process.env.NODE_ENV === "development") {
      return {
        status: true,
        data: {
          status: "success",
          amount: expectedAmount * 100, // Convert to kobo
          reference,
          paid_at: new Date().toISOString(),
          channel: "card",
          currency: "NGN",
        },
      }
    }
    throw new Error("Payment gateway not configured")
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Payment verification failed: ${response.status}`)
  }

  return await response.json()
}

export async function signIn(prevState: any, formData: FormData) {
  // Check if formData is valid
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  // Validate required fields
  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    // Return success instead of redirecting directly
    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signUp(prevState: any, formData: FormData) {
  // Check if formData is valid
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")
  const confirmPassword = formData.get("confirmPassword")
  const fullName = formData.get("fullName")
  const username = formData.get("username")
  const tier = formData.get("tier") || "grassroot"
  const paymentReference = formData.get("paymentReference")
  const tierPrice = formData.get("tierPrice")
  const enterpriseAmountUSD = formData.get("enterpriseAmountUSD")

  // Validate required fields
  if (!email || !password || !fullName || !username) {
    return { error: "All fields are required" }
  }

  // Validate password match
  if (password !== confirmPassword) {
    return { error: "Passwords do not match" }
  }

  // Validate password length
  if (password.toString().length < 6) {
    return { error: "Password must be at least 6 characters long" }
  }

  // Validate username length
  if (username.toString().length < 3) {
    return { error: "Username must be at least 3 characters long" }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.toString())) {
    return { error: "Please enter a valid email address" }
  }

  const tierPriceNum = tierPrice ? Number.parseInt(tierPrice.toString(), 10) : 0
  const isPaidTier = tierPriceNum > 0

  if (isPaidTier) {
    if (!paymentReference) {
      return { error: "Payment reference is required for paid tiers" }
    }

    try {
      const paymentVerification = await verifyPaystackPayment(paymentReference.toString(), tierPriceNum)

      if (!paymentVerification.status || paymentVerification.data.status !== "success") {
        return { error: "Payment verification failed. Please try again or contact support." }
      }

      // Verify amount matches (allow small tolerance for currency conversion)
      const expectedAmountKobo = tierPriceNum * 100
      const actualAmount = paymentVerification.data.amount

      if (Math.abs(actualAmount - expectedAmountKobo) > 100) {
        // 1 NGN tolerance
        return { error: "Payment amount mismatch. Please contact support." }
      }
    } catch (error) {
      console.error("Payment verification error:", error)
      return { error: "Payment verification failed. Please contact support if payment was deducted." }
    }
  }

  const supabase = await createClient()

  try {
    const userMetadata: any = {
      username: username.toString(),
      full_name: fullName.toString(),
      tier: tier.toString(),
    }

    if (isPaidTier) {
      userMetadata.payment_reference = paymentReference.toString()
      userMetadata.tier_price = tierPriceNum
      userMetadata.payment_verified = true
    }

    if (enterpriseAmountUSD) {
      userMetadata.enterprise_amount_usd = enterpriseAmountUSD.toString()
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
        data: userMetadata,
      },
    })

    if (error) {
      return { error: error.message }
    }

    if (data.user && !data.user.email_confirmed_at) {
      const tierMessage = isPaidTier ? ` Your ${tier} tier subscription is active.` : ""
      return {
        success: `Check your email to confirm your account.${tierMessage}`,
        redirect: "/dashboard",
      }
    }

    if (data.user && data.user.email_confirmed_at) {
      const tierMessage = isPaidTier ? ` Welcome to ${tier} tier!` : ""
      return {
        success: `Account created successfully!${tierMessage}`,
        redirect: "/dashboard",
      }
    }

    return {
      success: "Account created successfully!",
      redirect: "/dashboard",
    }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function resetPassword(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")

  if (!email) {
    return { error: "Email is required" }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.toString(), {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password`,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: "Check your email for password reset instructions." }
  } catch (error) {
    console.error("Reset password error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function updatePassword(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const password = formData.get("password")
  const confirmPassword = formData.get("confirmPassword")

  if (!password || !confirmPassword) {
    return { error: "Both password fields are required" }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" }
  }

  if (password.toString().length < 6) {
    return { error: "Password must be at least 6 characters long" }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.updateUser({
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    return { success: "Password updated successfully!" }
  } catch (error) {
    console.error("Update password error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
