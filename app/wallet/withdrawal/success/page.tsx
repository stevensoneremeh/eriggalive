"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, ArrowLeft, Clock, Building2, Coins, Calendar, Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

export default function WithdrawalSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [withdrawalData, setWithdrawalData] = useState<any>(null)

  useEffect(() => {
    // Get withdrawal data from URL params or localStorage
    const referenceCode = searchParams.get("ref")
    const amount = searchParams.get("amount")
    const bankName = searchParams.get("bank")

    if (referenceCode && amount && bankName) {
      setWithdrawalData({
        reference_code: referenceCode,
        amount_coins: Number.parseInt(amount),
        amount_naira: Number.parseInt(amount) * 0.5,
        bank_name: decodeURIComponent(bankName),
        created_at: new Date().toISOString(),
      })
    } else {
      // Try to get from localStorage as fallback
      const storedData = localStorage.getItem("lastWithdrawal")
      if (storedData) {
        setWithdrawalData(JSON.parse(storedData))
        localStorage.removeItem("lastWithdrawal") // Clean up
      } else {
        // Redirect to wallet if no data found
        router.push("/wallet")
      }
    }
  }, [searchParams, router])

  const copyReferenceCode = () => {
    if (withdrawalData?.reference_code) {
      navigator.clipboard.writeText(withdrawalData.reference_code)
      toast({
        title: "Copied!",
        description: "Reference code copied to clipboard",
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!withdrawalData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Withdrawal Submitted!</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Your withdrawal request has been successfully submitted and is now being reviewed.
          </p>
        </div>

        {/* Withdrawal Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              Withdrawal Details
            </CardTitle>
            <CardDescription>Reference: {withdrawalData.reference_code}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Reference Code */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Reference Code</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-mono">{withdrawalData.reference_code}</p>
              </div>
              <Button variant="outline" size="sm" onClick={copyReferenceCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            {/* Amount Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Coins Withdrawn</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {withdrawalData.amount_coins.toLocaleString()} coins
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Amount (NGN)</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(withdrawalData.amount_naira)}</p>
              </div>
            </div>

            <Separator />

            {/* Bank Details */}
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Destination Bank</p>
                <p className="font-medium text-gray-900 dark:text-white">{withdrawalData.bank_name}</p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Submitted On</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDate(withdrawalData.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              What Happens Next?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Review Process</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Our team will review your withdrawal request within 24 hours.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Processing</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Once approved, the transfer will be initiated to your bank account.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Completion</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Funds will arrive in your account within 1-3 business days.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    You will receive email notifications about the status of your withdrawal.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> You will receive email notifications at each stage of the process. You can also
                track your withdrawal status in your wallet.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild variant="outline" className="flex-1 bg-transparent">
            <Link href="/wallet">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Wallet
            </Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href="/wallet?tab=transactions">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Transaction History
            </Link>
          </Button>
        </div>

        {/* Support Information */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Need help? Contact our support team at{" "}
            <a href="mailto:support@eriggalive.com" className="text-primary hover:underline">
              support@eriggalive.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
