"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, XCircle, ArrowRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading")
  const [paymentDetails, setPaymentDetails] = useState<any>(null)

  useEffect(() => {
    const reference = searchParams.get("reference")
    const trxref = searchParams.get("trxref")

    const paymentRef = reference || trxref

    if (!paymentRef) {
      setStatus("failed")
      return
    }

    // Verify payment
    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/membership/payment/verify?reference=${paymentRef}`)
        const data = await response.json()

        if (data.success) {
          setStatus("success")
          setPaymentDetails(data.payment)
          toast({
            title: "Payment Successful!",
            description: "Your membership has been upgraded successfully.",
          })
        } else {
          setStatus("failed")
          toast({
            title: "Payment Verification Failed",
            description: data.message || "Please contact support if payment was deducted.",
            variant: "destructive",
          })
        }
      } catch (error) {
        setStatus("failed")
        toast({
          title: "Verification Error",
          description: "Unable to verify payment. Please contact support.",
          variant: "destructive",
        })
      }
    }

    verifyPayment()
  }, [searchParams, toast])

  const handleContinue = () => {
    if (paymentDetails?.metadata?.tier === "enterprise") {
      router.push("/dashboard/enterprise")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <Card>
          <CardContent className="p-8 text-center">
            {status === "loading" && (
              <>
                <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
                <h2 className="text-2xl font-bold mb-2">Verifying Payment</h2>
                <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                <p className="text-muted-foreground mb-6">
                  Your membership has been upgraded successfully. Welcome to the {paymentDetails?.metadata?.tier} tier!
                </p>
                {paymentDetails && (
                  <div className="bg-muted rounded-lg p-4 mb-6 text-left">
                    <div className="flex justify-between mb-2">
                      <span>Tier:</span>
                      <span className="font-medium capitalize">{paymentDetails.metadata?.tier}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Amount:</span>
                      <span className="font-medium">₦{paymentDetails.amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Billing:</span>
                      <span className="font-medium capitalize">{paymentDetails.metadata?.billing_interval}</span>
                    </div>
                  </div>
                )}
                <Button onClick={handleContinue} className="w-full">
                  Continue to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}

            {status === "failed" && (
              <>
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Payment Failed</h2>
                <p className="text-muted-foreground mb-6">
                  We couldn't verify your payment. If money was deducted, please contact support.
                </p>
                <div className="space-y-3">
                  <Button onClick={() => router.push("/premium")} className="w-full">
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/dashboard")} className="w-full">
                    Back to Dashboard
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
