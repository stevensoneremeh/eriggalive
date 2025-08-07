"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

interface AuthActionOptions {
  title?: string
  description?: string
  showToast?: boolean
  toastTitle?: string
  toastDescription?: string
}

export function useAuthAction() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const executeWithAuth = (
    action: () => void,
    options: AuthActionOptions = {}
  ) => {
    if (user) {
      action()
    } else {
      setPendingAction(() => action)
      setShowLoginPrompt(true)
      
      if (options.showToast) {
        toast({
          title: options.toastTitle || "Authentication Required",
          description: options.toastDescription || "Please sign in to continue.",
          variant: "destructive",
        })
      }
    }
  }

  const handleLoginSuccess = () => {
    setShowLoginPrompt(false)
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }

  const handleLoginCancel = () => {
    setShowLoginPrompt(false)
    setPendingAction(null)
  }

  return {
    executeWithAuth,
    showLoginPrompt,
    handleLoginSuccess,
    handleLoginCancel,
    isAuthenticated: !!user
  }
}
