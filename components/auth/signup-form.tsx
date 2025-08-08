"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { getPasswordStrength, isStrongEnough, validateEmail, type PasswordStrength } from "@/lib/validation/password"
import { signupAction } from "@/app/(auth)/signup/actions"

type SignupFormProps = {
  onSuccessRedirect?: string
  includeUsername?: boolean
  includeFullName?: boolean
  showSocial?: boolean
  className?: string
}

type FormState = {
  email: string
  password: string
  username: string
  fullName: string
}

type FieldError = {
  email?: string
  password?: string
  username?: string
  fullName?: string
  general?: string
}

const initialState: FormState = {
  email: "",
  password: "",
  username: "",
  fullName: "",
}

export default function SignupForm({
  onSuccessRedirect = "/signup/success",
  includeUsername = false,
  includeFullName = false,
  showSocial = false,
  className = "",
}: SignupFormProps) {
  const router = useRouter()
  const { signUp } = useAuth()
  const { toast } = useToast()

  const [values, setValues] = useState<FormState>(initialState)
  const [errors, setErrors] = useState<FieldError>({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Password strength calculation (real-time)
  const strength: PasswordStrength = useMemo(() => getPasswordStrength(values.password, values.email), [values.password, values.email])

  // Real-time email validation feedback
  useEffect(() => {
    if (!values.email) {
      setErrors((e) => ({ ...e, email: undefined }))
      return
    }
    if (!validateEmail(values.email)) {
      setErrors((e) => ({ ...e, email: "Please enter a valid email address." }))
    } else {
      setErrors((e) => ({ ...e, email: undefined }))
    }
  }, [values.email])

  // Real-time password validation feedback
  useEffect(() => {
    if (!values.password) {
      setErrors((e) => ({ ...e, password: undefined }))
      return
    }
    if (!isStrongEnough(strength)) {
      setErrors((e) => ({ ...e, password: strength.feedback || "Password is too weak." }))
    } else {
      setErrors((e) => ({ ...e, password: undefined }))
    }
  }, [values.password, strength])

  // Basic username/full name checks if included
  useEffect(() => {
    if (includeUsername) {
      if (values.username && !/^[a-zA-Z0-9._-]{3,20}$/.test(values.username)) {
        setErrors((e) => ({ ...e, username: "Username must be 3-20 characters (letters, numbers, . _ -)." }))
      } else {
        setErrors((e) => ({ ...e, username: undefined }))
      }
    }
  }, [values.username, includeUsername])

  useEffect(() => {
    if (includeFullName) {
      if (values.fullName && values.fullName.trim().length < 2) {
        setErrors((e) => ({ ...e, fullName: "Please enter your full name." }))
      } else {
        setErrors((e) => ({ ...e, fullName: undefined }))
      }
    }
  }, [values.fullName, includeFullName])

  // Friendly error mapping for Supabase
  const mapSupabaseError = (message?: string) => {
    const msg = (message || "").toLowerCase()
    if (msg.includes("already registered") || msg.includes("email") && msg.includes("exists")) {
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

  const validateClient = (): boolean => {
    const next: FieldError = {}
    if (!validateEmail(values.email)) {
      next.email = "Please enter a valid email address."
    }
    if (!isStrongEnough(strength)) {
      next.password = strength.feedback || "Password is too weak."
    }
    if (includeUsername && !/^[a-zA-Z0-9._-]{3,20}$/.test(values.username)) {
      next.username = "Username must be 3-20 characters (letters, numbers, . _ -)."
    }
    if (includeFullName && values.fullName.trim().length < 2) {
      next.fullName = "Please enter your full name."
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
  }

  // Client-side enhanced path (uses Auth Context)
  const onSubmitClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loading) return
    const ok = validateClient()
    if (!ok) return

    try {
      setLoading(true)
      const meta: Record<string, any> = {}
      if (includeUsername && values.username) meta.username = values.username
      if (includeFullName && values.fullName) meta.full_name = values.fullName

      const { error } = await signUp(values.email, values.password, meta)
      if (error) {
        const friendly = mapSupabaseError(error.message)
        setErrors((prev) => ({ ...prev, general: friendly }))
        toast({ title: "Sign up failed", description: friendly, variant: "destructive" })
        return
      }

      toast({ title: "Account created", description: "Welcome! We’ve sent a confirmation email if required." })
      router.push(onSuccessRedirect)
    } catch (err: any) {
      const friendly = mapSupabaseError(err?.message)
      setErrors((prev) => ({ ...prev, general: friendly }))
      toast({ title: "Network error", description: friendly, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Progressive enhancement fallback: keep action to server when JS is disabled
  // Note: When JS is enabled, onSubmitClient prevents default and handles locally.
  // With JS disabled, the server action runs and returns a navigation or error.
  const [serverState, setServerAction] = (globalThis as any).useActionState
    ? (globalThis as any).useActionState(signupAction, null)
    : // In Next.js, useActionState is provided by React 19. If not present, fallback stub.
      [null, undefined]

  const meterSegments = [
    { min: 0, className: "bg-muted" },
    { min: 1, className: "bg-red-500" },
    { min: 2, className: "bg-orange-500" },
    { min: 3, className: "bg-yellow-500" },
    { min: 4, className: "bg-green-500" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("w-full", className)}
    >
      <form
        action={setServerAction}
        onSubmit={onSubmitClient}
        className="space-y-4"
        aria-describedby="form-errors"
        noValidate
      >
        <div className={cn("grid gap-4", (includeUsername || includeFullName) ? "md:grid-cols-2" : "md:grid-cols-1")}>
          {includeFullName && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <div className="relative">
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Jane Doe"
                  value={values.fullName}
                  onChange={handleChange("fullName")}
                  disabled={loading}
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? "fullName-error" : undefined}
                />
              </div>
              <AnimatePresence initial={false}>
                {errors.fullName && (
                  <motion.p
                    id="fullName-error"
                    role="alert"
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -2 }}
                    className="text-xs text-destructive"
                  >
                    {errors.fullName}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}
          {includeUsername && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  name="username"
                  placeholder="yourname"
                  value={values.username}
                  onChange={handleChange("username")}
                  disabled={loading}
                  aria-invalid={!!errors.username}
                  aria-describedby={errors.username ? "username-error" : undefined}
                />
              </div>
              <AnimatePresence initial={false}>
                {errors.username && (
                  <motion.p
                    id="username-error"
                    role="alert"
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -2 }}
                    className="text-xs text-destructive"
                  >
                    {errors.username}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              className="pl-9"
              value={values.email}
              onChange={handleChange("email")}
              disabled={loading}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              autoComplete="email"
              inputMode="email"
            />
          </div>
          <AnimatePresence initial={false}>
            {errors.email && (
              <motion.p
                id="email-error"
                role="alert"
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                className="text-xs text-destructive"
              >
                {errors.email}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              className="pl-9 pr-10"
              value={values.password}
              onChange={handleChange("password")}
              disabled={loading}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : "password-help"}
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((s) => !s)}
              disabled={loading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          {/* Password strength meter */}
          <div className="space-y-1" aria-live="polite">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => {
                const filled = strength.score > i
                const cls =
                  filled
                    ? meterSegments.find((s) => s.min === strength.score)?.className || "bg-muted"
                    : "bg-muted"
                return <div key={i} className={cn("h-1 w-1/4 rounded transition-colors", cls)} />
              })}
            </div>
            <p id="password-help" className="text-xs text-muted-foreground">
              {strength.hint}
            </p>
          </div>

          <AnimatePresence initial={false}>
            {errors.password && (
              <motion.p
                id="password-error"
                role="alert"
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                className="text-xs text-destructive"
              >
                {errors.password}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence initial={false}>
          {(errors.general || serverState?.error) && (
            <motion.div
              id="form-errors"
              role="alert"
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              className="text-sm text-destructive"
            >
              {errors.general || serverState?.error}
            </motion.div>
          )}
        </AnimatePresence>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>

        {showSocial && (
          <div className="pt-2 text-center text-xs text-muted-foreground">
            Social sign-in coming soon
          </div>
        )}
      </form>
    </motion.div>
  )
}
