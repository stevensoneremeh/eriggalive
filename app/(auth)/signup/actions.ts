"use server"

import { z } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase-utils"
import { getPasswordStrength, isStrongEnough, validateEmail } from "@/lib/validation/password"

const SignupSchema = z.object({
  email: z.string().min(1).refine((v) => validateEmail(v), "Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  username: z.string().optional(),
  fullName: z.string().optional(),
})

type ActionResult = {
  ok: boolean
  error?: string
  redirect?: string
}

export async function signupAction(formData: FormData): Promise<ActionResult> {
  try {
    const raw = {
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      username: formData.get("username") ? String(formData.get("username")) : undefined,
      fullName: formData.get("fullName") ? String(formData.get("fullName")) : undefined,
    }

    const parsed = SignupSchema.safeParse(raw)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Invalid form input."
      return { ok: false, error: msg }
    }

    const pw = getPasswordStrength(parsed.data.password, parsed.data.email)
    if (!isStrongEnough(pw)) {
      return { ok: false, error: pw.feedback || "Password is too weak." }
    }

    const supabase = createServerSupabaseClient()
    const meta: Record<string, any> = {}
    if (parsed.data.username) meta.username = parsed.data.username
    if (parsed.data.fullName) meta.full_name = parsed.data.fullName

    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: meta },
    })

    if (error) {
      const friendly = mapSupabaseError(error.message)
      return { ok: false, error: friendly }
    }

    // Let the client decide where to go; default success
    return { ok: true, redirect: "/signup/success" }
  } catch (err: any) {
    const friendly = mapSupabaseError(err?.message)
    return { ok: false, error: friendly }
  }
}

function mapSupabaseError(message?: string) {
  const msg = (message || "").toLowerCase()
  if (msg.includes("already registered") || (msg.includes("email") && msg.includes("exists"))) {
    return "This email is already in use. Try signing in or use a different email."
  }
  if (msg.includes("invalid email")) {
    return "Invalid email format. Please check and try again."
  }
  if (msg.includes("rate") || msg.includes("too many") || msg.includes("429")) {
    return "Too many attempts. Please wait a moment and try again."
  }
  if (msg.includes("password")) {
    return "Your password does not meet the requirements. Please choose a stronger one."
  }
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("timeout")) {
    return "Network error. Check your connection and try again."
  }
  return "Unable to sign up right now. Please try again."
}
