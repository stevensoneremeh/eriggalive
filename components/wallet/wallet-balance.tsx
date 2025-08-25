"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coins, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface Transaction {
  id: string
  amount: number
  type: "credit" | "debit"
  description: string
  created_at: string
}

export function WalletBalance() {
  const supabase = createClientComponentClient()
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWalletData = async () => {
    try {
      // Fetch balance
      const balanceResponse = await fetch("/api/wallet/balance")
      const balanceData = await balanceResponse.json()

      if (balanceResponse.ok) {
        setBalance(balanceData.balance)
      }

      // Fetch recent transactions
      const transactionsResponse = await fetch("/api/wallet/transactions?limit=10")
      const transactionsData = await transactionsResponse.json()

      if (transactionsResponse.ok) {
        setTransactions(transactionsData.transactions)
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error)
      toast.error("Failed to load wallet data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWalletData()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Coins className="h-6 w-6" />
            <span>Erigga Coins</span>
          </CardTitle>
          <CardDescription className="text-blue-100">Your current balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{balance.toLocaleString()}</p>
              <p className="text-blue-100">Available coins</p>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchWalletData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest coin transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-full ${
                        transaction.type === "credit"
                          ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                          : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
                      }`}
                    >
                      {transaction.type === "credit" ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                      {transaction.type === "credit" ? "+" : "-"}
                      {transaction.amount.toLocaleString()}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {transaction.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
