"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { History, Coins, Calendar, RefreshCw, Loader2, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react"

interface Withdrawal {
  id: string
  reference_code: string
  amount_coins: number
  amount_naira: number
  status: string
  admin_notes?: string
  created_at: string
  processed_at?: string
  bank_accounts: {
    account_number: string
    account_name: string
    nigerian_banks: {
      bank_name: string
      bank_type: string
    }
  }
}

export function WithdrawalHistory() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const fetchWithdrawals = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/withdrawals/history")
      const data = await response.json()

      if (data.success) {
        setWithdrawals(data.withdrawals)
      } else {
        setError(data.error || "Failed to fetch withdrawal history")
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error)
      setError("Network error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "rejected":
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "rejected":
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading withdrawal history...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading History</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchWithdrawals}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Withdrawal History
          </CardTitle>
          <CardDescription>Track your withdrawal requests and their status</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchWithdrawals}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {withdrawals.length === 0 ? (
          <div className="text-center py-8">
            <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Withdrawals Yet</h3>
            <p className="text-muted-foreground">Your withdrawal requests will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="border rounded-lg p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(withdrawal.status)}
                    <span className="font-medium">Withdrawal #{withdrawal.reference_code}</span>
                  </div>
                  <Badge className={getStatusColor(withdrawal.status)}>{withdrawal.status}</Badge>
                </div>

                {/* Amount Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Amount</div>
                    <div className="font-medium">{withdrawal.amount_coins.toLocaleString()} coins</div>
                    <div className="text-muted-foreground">{formatCurrency(withdrawal.amount_naira)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Bank Account</div>
                    <div className="font-medium">{withdrawal.bank_accounts.nigerian_banks.bank_name}</div>
                    <div className="text-muted-foreground">
                      {withdrawal.bank_accounts.account_number} • {withdrawal.bank_accounts.account_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Date</div>
                    <div className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(withdrawal.created_at)}
                    </div>
                    {withdrawal.processed_at && (
                      <div className="text-muted-foreground text-xs">
                        Processed: {formatDate(withdrawal.processed_at)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Notes */}
                {withdrawal.admin_notes && (
                  <>
                    <Separator />
                    <div className="text-sm">
                      <div className="text-muted-foreground mb-1">Admin Notes:</div>
                      <div className="text-gray-700 bg-gray-50 p-2 rounded">{withdrawal.admin_notes}</div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
