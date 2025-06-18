"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CoinPurchaseEnhanced } from "./coin-purchase-enhanced"
import { CoinWithdrawalEnhanced } from "./coin-withdrawal-enhanced"
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Users,
  Copy,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  Wallet,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Transaction {
  id: string
  type: "opening_balance" | "purchase" | "withdrawal" | "referral"
  amount: number
  nairaAmount?: number
  description: string
  createdAt: string
  status?: "completed" | "pending" | "failed"
}

interface BalanceData {
  currentBalance: number
  openingBalance: number
  totalPurchased: number
  totalWithdrawn: number
  referralEarnings: number
  transactions: Transaction[]
}

export function EriggaCoinDashboard() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [referralCode, setReferralCode] = useState("")
  const [referralLink, setReferralLink] = useState("")
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)

  const fetchBalanceData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/coins/balance", {
        headers: {
          Authorization: `Bearer mock-token`, // In production, use real JWT
        },
      })
      const result = await response.json()

      if (result.success) {
        setBalanceData(result.balance)
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateReferralCode = async () => {
    try {
      const response = await fetch("/api/referral/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer mock-token`,
        },
      })
      const result = await response.json()

      if (result.success) {
        setReferralCode(result.referralCode)
        setReferralLink(result.referralLink)
      }
    } catch (error) {
      console.error("Failed to generate referral code:", error)
    }
  }

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink)
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    })
  }

  useEffect(() => {
    fetchBalanceData()
    generateReferralCode()
  }, [])

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`
  const formatCoins = (amount: number) => `${amount.toLocaleString()} coins`

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <ArrowUpRight className="h-4 w-4 text-green-500" />
      case "withdrawal":
        return <ArrowDownRight className="h-4 w-4 text-red-500" />
      case "referral":
        return <Gift className="h-4 w-4 text-blue-500" />
      default:
        return <Coins className="h-4 w-4 text-yellow-500" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "purchase":
      case "referral":
      case "opening_balance":
        return "text-green-600"
      case "withdrawal":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Erigga Coin Dashboard</h1>
          <p className="text-muted-foreground">Manage your coins and transactions</p>
        </div>
        <Button onClick={fetchBalanceData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCoins(balanceData?.currentBalance || 0)}</div>
            <p className="text-xs text-muted-foreground">
              ≈ {formatCurrency((balanceData?.currentBalance || 0) * 0.5)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opening Balance</CardTitle>
            <Gift className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCoins(balanceData?.openingBalance || 500)}</div>
            <p className="text-xs text-muted-foreground">Welcome bonus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchased</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCoins(balanceData?.totalPurchased || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Spent: {formatCurrency((balanceData?.totalPurchased || 0) * 0.5)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referral Earnings</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCoins(balanceData?.referralEarnings || 0)}</div>
            <p className="text-xs text-muted-foreground">100 coins per referral</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
          <DialogTrigger asChild>
            <Button className="flex-1 bg-green-500 hover:bg-green-600">
              <Coins className="h-4 w-4 mr-2" />
              Buy Coins
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Purchase Erigga Coins</DialogTitle>
              <DialogDescription>Buy coins securely with Paystack</DialogDescription>
            </DialogHeader>
            <CoinPurchaseEnhanced
              onSuccess={() => {
                setShowPurchaseDialog(false)
                fetchBalanceData()
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1">
              <TrendingDown className="h-4 w-4 mr-2" />
              Withdraw Coins
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Withdraw Erigga Coins</DialogTitle>
              <DialogDescription>Convert your coins back to Naira</DialogDescription>
            </DialogHeader>
            <CoinWithdrawalEnhanced
              onSuccess={() => {
                setShowWithdrawDialog(false)
                fetchBalanceData()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Referral Program */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Referral Program
          </CardTitle>
          <CardDescription>Earn 100 Erigga Coins for each friend you refer!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={referralLink} readOnly placeholder="Generating referral link..." />
            <Button onClick={copyReferralLink} variant="outline">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Share this link with friends. When they sign up and make their first purchase, you both get 100 coins!
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your recent coin transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {balanceData?.transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${getTransactionColor(transaction.type)}`}>
                    {transaction.amount > 0 ? "+" : ""}
                    {formatCoins(transaction.amount)}
                  </p>
                  {transaction.nairaAmount && (
                    <p className="text-sm text-muted-foreground">{formatCurrency(transaction.nairaAmount)}</p>
                  )}
                  {transaction.status && (
                    <Badge variant={transaction.status === "completed" ? "default" : "secondary"}>
                      {transaction.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
