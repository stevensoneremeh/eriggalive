"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export function useAuthAction() {
 const [showLoginPrompt, setShowLoginPrompt] = useState(false)
 const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
 const { user } = useAuth()
 const { toast } = useToast()

 const executeWithAuth = (action: () => void, options?: {
   title?: string
   description?: string
   showToast?: boolean
 }) => {
   if (user) {
     action()
   } else {
     if (options?.showToast) {
       toast({
         title: options.title || "Sign in required",
         description: options.description || "Please sign in to perform this action.",
         variant: "default",
       })
     }
     setPendingAction(() => action)
     setShowLoginPrompt(true)
   }
 }

 const handleLoginSuccess = () => {
   if (pendingAction) {
     pendingAction()
     setPendingAction(null)
   }
   setShowLoginPrompt(false)
 }

 const handleLoginCancel = () => {
   setPendingAction(null)
   setShowLoginPrompt(false)
 }

 return {
   executeWithAuth,
   showLoginPrompt,
   handleLoginSuccess,
   handleLoginCancel,
 }
}
