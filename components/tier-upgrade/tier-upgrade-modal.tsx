"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { tierService } from "@/lib/tier-service"
import { useToast } from "@/components/ui/use-toast"

interface TierUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  tierName: string
  amount: number
  paymentReference: string
  onSuccess: () => void
}

export function TierUpgradeModal({
  isOpen,
  onClose,
  tierName,
  amount,
  paymentReference,
  onSuccess,
}: TierUpgradeModalProps) {
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying")
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && paymentReference) {
      verifyPayment()
    }
  }, [isOpen, paymentReference])

  const verifyPayment = async () => {
    try {
      setStatus("verifying")
      setError(null)

      const success = await tierService.verifyPayment(paymentReference)

      if (success) {
        setStatus("success")
        toast({
          title: "Upgrade Successful!",
          description: `You have been upgraded to ${tierName}`,
          duration: 5000,
        })

        // Call success callback after a short delay
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 2000)
      } else {
        setStatus("failed")
        setError("Payment verification failed. Please contact support if money was deducted.")
      }
    } catch (err) {
      setStatus("failed")
      setError("An error occurred while verifying your payment. Please try again.")
      console.error("Payment verification error:", err)
    }
  }

  const handleRetry = () => {
    verifyPayment()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment Verification</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {status === "verifying" && (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <div>
                <h3 className="font-semibold">Verifying your payment...</h3>
                <p className="text-sm text-muted-foreground">Please wait while we confirm your upgrade to {tierName}</p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <div>
                <h3 className="font-semibold text-green-700">Payment Successful!</h3>
                <p className="text-sm text-muted-foreground">You have been successfully upgraded to {tierName}</p>
                <p className="text-xs text-muted-foreground mt-2">Amount: ₦{amount.toLocaleString()}</p>
              </div>
            </div>
          )}

          {status === "failed" && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">Reference: {paymentReference}</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  <Button onClick={handleRetry}>Retry Verification</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
