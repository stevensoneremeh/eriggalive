"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Wallet,
  Coins,
  TrendingDown,
  Plus,
  Minus,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  EyeOff,
  Building2,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useUserBalance } from "@/hooks/useUserBalance"
import { CoinPurchaseEnhanced } from "@/components/coin-purchase-enhanced"
import { WithdrawalRequestForm } from "@/components/withdrawal/withdrawal-request-form"
import { WithdrawalHistory } from "@/components/withdrawal/withdrawal-history"
import { BankAccountManager } from "@/components/bank/bank-account-manager"

interface Transaction {
  id: string
  type: "purchase" | "refund" | "withdrawal" | "deposit" | "transfer"
  category: "ticket" | "membership" | "coins" | "merchandise" | "other"
  amount_naira?: number
  amount_coins?: number
  payment_method: string
  status: string
  description: string
  created_at: string
  reference_type?: string
  metadata?: Record<string, string | number | boolean>
}

export function WalletDashboard() {
  const { profile } = useAuth()
  const { balance, walletBalance, refresh, isLoading } = useUserBalance()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showBalance, setShowBalance] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  const fetchTransactions = useCallback(async () => {
    if (!profile?.id) return

    setLoadingTransactions(true)
    try {
      const response = await fetch("/api/wallet/transactions?limit=50")
      if (response.ok) {
        const data = await response.json()
        const sanitizedTransactions = (data.transactions || []).map((t: any) => ({
          id: t.id,
          type: t.type,
          category: t.category,
          amount_naira: t.amount_naira,
          amount_coins: t.amount_coins,
          payment_method: t.payment_method,
          status: t.status,
          description: t.description,
          created_at: t.created_at,
          reference_type: t.reference_type,
          metadata:
            t.metadata && typeof t.metadata === "object"
              ? Object.fromEntries(
                  Object.entries(t.metadata).filter(
                    ([_, value]) =>
                      typeof value === "string" || typeof value === "number" || typeof value === "boolean",
                  ),
                )
              : undefined,
        }))
        setTransactions(sanitizedTransactions)
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
      setTransactions([])
    } finally {
      setLoadingTransactions(false)
    }
  }, [profile?.id])

  // Fetch transaction history
  useEffect(() => {
    fetchTransactions()

    return () => {
      setTransactions([])
      setLoadingTransactions(false)
    }
  }, [fetchTransactions])

  const handlePurchaseSuccess = useCallback(
    (transaction: any) => {
      refresh()
      fetchTransactions()
    },
    [refresh, fetchTransactions],
  )

  const handleWithdrawalSuccess = useCallback((withdrawal: any) => {
    const sanitizedWithdrawal = {
      reference_code: withdrawal.reference_code,
      amount_coins: withdrawal.amount_coins,
      bank_name: withdrawal.bank_account?.bank_name || "Unknown Bank",
      created_at: withdrawal.created_at,
    }

    try {
      localStorage.setItem("lastWithdrawal", JSON.stringify(sanitizedWithdrawal))
      const params = new URLSearchParams({
        ref: sanitizedWithdrawal.reference_code,
        amount: sanitizedWithdrawal.amount_coins.toString(),
        bank: sanitizedWithdrawal.bank_name,
      })
      window.location.href = `/wallet/withdrawal/success?${params.toString()}`
    } catch (error) {
      console.error("Error storing withdrawal data:", error)
      // Fallback navigation without params
      window.location.href = "/wallet/withdrawal/success"
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
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

  const getTransactionIcon = (type: string, category: string) => {
    switch (type) {
      case "purchase":
        return <ArrowDownLeft className="w-4 h-4 text-red-500" />
      case "deposit":
        return <ArrowUpRight className="w-4 h-4 text-green-500" />
      case "withdrawal":
        return <ArrowDownLeft className="w-4 h-4 text-orange-500" />
      case "refund":
        return <ArrowUpRight className="w-4 h-4 text-blue-500" />
      default:
        return <History className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Calculate statistics
  const totalSpent = transactions
    .filter((t) => t.type === "purchase" && t.status === "completed")
    .reduce((sum, t) => sum + (t.amount_naira || 0), 0)

  const totalEarned = transactions
    .filter((t) => (t.type === "deposit" || t.type === "refund") && t.status === "completed")
    .reduce((sum, t) => sum + (t.amount_naira || 0), 0)

  const recentTransactions = transactions.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wallet</h1>
          <p className="text-muted-foreground">Manage your Erigga Coins and wallet balance</p>
        </div>
        <Button onClick={refresh} variant="outline" disabled={isLoading}>
          {isLoading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Erigga Coins */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Erigga Coins</CardTitle>
              <Coins className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-yellow-700">
                  {showBalance ? balance.toLocaleString() : "••••••"}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowBalance(!showBalance)}>
                  {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-yellow-600 mt-1">≈ {formatCurrency(balance * 0.5)}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Wallet Balance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <Wallet className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {showBalance ? formatCurrency(walletBalance) : "••••••"}
              </div>
              <p className="text-xs text-green-600 mt-1">Available for withdrawal</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Spent */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingDown className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">
                {showBalance ? formatCurrency(totalSpent) : "••••••"}
              </div>
              <p className="text-xs text-purple-600 mt-1">All-time purchases</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="purchase">Buy Coins</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="banks">Bank Accounts</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 bg-transparent"
                  onClick={() => setActiveTab("purchase")}
                >
                  <Plus className="h-5 w-5" />
                  Buy Coins
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 bg-transparent"
                  onClick={() => setActiveTab("withdraw")}
                >
                  <Minus className="h-5 w-5" />
                  Withdraw
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 bg-transparent"
                  onClick={() => setActiveTab("banks")}
                >
                  <Building2 className="h-5 w-5" />
                  Bank Accounts
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 bg-transparent"
                  onClick={() => setActiveTab("history")}
                >
                  <History className="h-5 w-5" />
                  History
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab("history")}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {loadingTransactions ? (
                <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
              ) : recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type, transaction.category)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(transaction.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {transaction.amount_naira && formatCurrency(transaction.amount_naira)}
                          {transaction.amount_coins && `${transaction.amount_coins} coins`}
                        </div>
                        <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No transactions yet</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Erigga Coins</CardTitle>
            </CardHeader>
            <CardContent>
              <CoinPurchaseEnhanced
                onSuccess={handlePurchaseSuccess}
                onError={(error) => {
                  console.error("Purchase error:", error)
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdraw" className="space-y-6">
          <WithdrawalRequestForm
            onSuccess={handleWithdrawalSuccess}
            onError={(error) => {
              console.error("Withdrawal error:", error)
            }}
          />
        </TabsContent>

        <TabsContent value="banks" className="space-y-6">
          <BankAccountManager />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <WithdrawalHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
