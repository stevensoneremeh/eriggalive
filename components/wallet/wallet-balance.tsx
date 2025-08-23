"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coins, RefreshCw, TrendingUp, TrendingDown } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface WalletTransaction {
  id: string
  type: "credit" | "debit"
  amount_coins: number
  reason: string
  created_at: string
}

interface WalletData {
  balance_coins: number
  transactions: WalletTransaction[]
}

export function WalletBalance() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchWallet = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/wallet/balance")
      const data = await response.json()

      if (data.success) {
        setWallet(data.wallet)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch wallet",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Wallet fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch wallet data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatReason = (reason: string) => {
    return reason.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getTransactionIcon = (type: string) => {
    return type === "credit" ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    )
  }

  const getTransactionColor = (type: string) => {
    return type === "credit" ? "text-green-600" : "text-red-600"
  }

  useEffect(() => {
    fetchWallet()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Coins className="h-5 w-5 mr-2 text-yellow-500" />
              Erigga Coins
            </CardTitle>
            <CardDescription>Your current coin balance and recent transactions</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchWallet} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance Display */}
        <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg">
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {wallet?.balance_coins?.toLocaleString() || "0"}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Available Coins</div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h3 className="font-semibold mb-3">Recent Transactions</h3>
          <div className="space-y-2">
            {wallet?.transactions?.length ? (
              wallet.transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="font-medium">{formatReason(transaction.reason)}</p>
                      <p className="text-sm text-gray-500">{new Date(transaction.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === "credit" ? "+" : "-"}
                      {transaction.amount_coins.toLocaleString()}
                    </p>
                    <Badge variant={transaction.type === "credit" ? "default" : "secondary"}>{transaction.type}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Coins className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No transactions yet</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
