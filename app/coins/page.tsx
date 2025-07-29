"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import {
  Coins,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Wallet,
  Gift,
  History,
  Star,
  Crown,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

interface Transaction {
  id: string
  type: "earned" | "spent" | "purchased" | "withdrawn"
  amount: number
  description: string
  created_at: string
  status: "completed" | "pending" | "failed"
}

declare global {
  interface Window {
    PaystackPop: any
  }
}

export default function CoinsPage() {
  const { user, profile, isLoading, refreshProfile } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [purchaseAmount, setPurchaseAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Mock data for demonstration
  const mockTransactions: Transaction[] = [
    {
      id: "1",
      type: "earned",
      amount: 100,
      description: "Daily login bonus",
      created_at: new Date().toISOString(),
      status: "completed",
    },
    {
      id: "2",
      type: "spent",
      amount: -50,
      description: "Voted on community post",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      status: "completed",
    },
    {
      id: "3",
      type: "purchased",
      amount: 1000,
      description: "Coin purchase - ₦500",
      created_at: new Date(Date.now() - 172800000).toISOString(),
      status: "completed",
    },
  ]

  useEffect(() => {
    if (user) {
      loadTransactions()
    }
  }, [user])

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://js.paystack.co/v1/inline.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const loadTransactions = async () => {
    try {
      // For now, use mock data
      setTransactions(mockTransactions)
    } catch (error) {
      console.error("Error loading transactions:", error)
      setTransactions(mockTransactions)
    }
  }

  const handlePurchase = async (coinAmount?: number) => {
    const amount = coinAmount || Number.parseInt(purchaseAmount)

    if (!amount || !user) return

    if (amount < 100) {
      toast.error("Minimum purchase is 100 coins")
      return
    }

    setLoading(true)

    try {
      // Calculate price (2 coins = ₦1)
      const price = Math.floor(amount / 2)

      if (!window.PaystackPop) {
        throw new Error("Paystack not loaded")
      }

      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_your_key_here",
        email: user.email,
        amount: price * 100, // Convert to kobo
        currency: "NGN",
        ref: `erigga_coins_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          custom_fields: [
            {
              display_name: "Coin Amount",
              variable_name: "coin_amount",
              value: amount.toString(),
            },
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: user.id,
            },
          ],
        },
        callback: async (response: any) => {
          try {
            // Verify payment on server
            const verifyResponse = await fetch("/api/coins/purchase", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.id}`,
              },
              body: JSON.stringify({
                reference: response.reference,
                amount: price,
                coins: amount,
              }),
            })

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json()
              throw new Error(errorData.error || "Payment verification failed")
            }

            const result = await verifyResponse.json()

            toast.success(`Successfully purchased ${amount.toLocaleString()} Erigga Coins!`)
            setPurchaseAmount("")
            loadTransactions()
            refreshProfile() // Refresh user profile to update coin balance
          } catch (error: any) {
            console.error("Payment verification error:", error)
            toast.error(error.message || "Payment completed but verification failed. Please contact support.")
          }
        },
        onClose: () => {
          setLoading(false)
        },
      })

      handler.openIframe()
    } catch (error: any) {
      console.error("Payment error:", error)
      toast.error(error.message || "An error occurred during payment")
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || !user || !profile) return

    setLoading(true)
    try {
      const amount = Number.parseInt(withdrawAmount)
      if (amount > (profile.coins || 0)) {
        toast.error("Insufficient coin balance")
        return
      }

      if (amount < 500) {
        toast.error("Minimum withdrawal is 500 coins")
        return
      }

      // Mock withdrawal success
      toast.success(`Withdrawal request for ${amount} coins submitted!`)
      setWithdrawAmount("")
      loadTransactions()
    } catch (error) {
      toast.error("Withdrawal failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "earned":
        return <ArrowUpRight className="h-4 w-4 text-green-500" />
      case "spent":
        return <ArrowDownLeft className="h-4 w-4 text-red-500" />
      case "purchased":
        return <CreditCard className="h-4 w-4 text-blue-500" />
      case "withdrawn":
        return <Wallet className="h-4 w-4 text-purple-500" />
      default:
        return <Coins className="h-4 w-4" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "earned":
        return "text-green-600"
      case "spent":
        return "text-red-600"
      case "purchased":
        return "text-blue-600"
      case "withdrawn":
        return "text-purple-600"
      default:
        return "text-gray-600"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading coins...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Coins className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sign in Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to view your coin balance and transactions.</p>
            <Button asChild>
              <a href="/login">Sign In</a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Coins className="h-4 w-4" />
            Erigga Coins
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
            Your Coin Wallet
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Earn, spend, and manage your Erigga Coins to unlock exclusive content and features
          </p>
        </div>

        {/* Balance Card */}
        <Card className="mb-8 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-2xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-lg mb-2">Current Balance</p>
                <div className="flex items-center gap-3">
                  <Coins className="h-8 w-8" />
                  <span className="text-4xl font-bold">{profile?.coins?.toLocaleString() || 0}</span>
                  <span className="text-xl">Coins</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-yellow-100 mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>This Month</span>
                </div>
                <p className="text-2xl font-bold">+{Math.floor(Math.random() * 500 + 200)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                <Gift className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">+{Math.floor(Math.random() * 100 + 50)}</p>
              <p className="text-sm text-muted-foreground">Earned Today</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{Math.floor(Math.random() * 10 + 5)}</p>
              <p className="text-sm text-muted-foreground">Votes Cast</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-4">
                <Crown className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">{profile?.tier || "Grassroot"}</p>
              <p className="text-sm text-muted-foreground">Current Tier</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full mb-4">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">{Math.floor(Math.random() * 5 + 1)}</p>
              <p className="text-sm text-muted-foreground">Streak Days</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="purchase" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Purchase
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Withdraw
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-6">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Coins className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                    <p className="text-muted-foreground">Start earning coins by participating in the community!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                            {transaction.amount > 0 ? "+" : ""}
                            {transaction.amount} coins
                          </p>
                          <Badge variant={transaction.status === "completed" ? "default" : "secondary"}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchase" className="space-y-6">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Purchase Coins
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Coins className="h-4 w-4" />
                  <AlertDescription>
                    Purchase Erigga Coins to vote on posts, unlock exclusive content, and support your favorite artists.
                    Exchange rate: 2 coins = ₦1
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card
                    className="border-2 border-dashed border-gray-300 hover:border-primary cursor-pointer transition-colors"
                    onClick={() => handlePurchase(500)}
                  >
                    <CardContent className="p-6 text-center">
                      <Coins className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <p className="font-bold text-lg">500 Coins</p>
                      <p className="text-muted-foreground">₦250</p>
                    </CardContent>
                  </Card>

                  <Card
                    className="border-2 border-primary bg-primary/5 cursor-pointer"
                    onClick={() => handlePurchase(1000)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="relative">
                        <Coins className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                        <Badge className="absolute -top-2 -right-2 bg-green-500">Popular</Badge>
                      </div>
                      <p className="font-bold text-lg">1,000 Coins</p>
                      <p className="text-muted-foreground">₦450</p>
                      <p className="text-xs text-green-600">Save ₦50!</p>
                    </CardContent>
                  </Card>

                  <Card
                    className="border-2 border-dashed border-gray-300 hover:border-primary cursor-pointer transition-colors"
                    onClick={() => handlePurchase(2500)}
                  >
                    <CardContent className="p-6 text-center">
                      <Coins className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <p className="font-bold text-lg">2,500 Coins</p>
                      <p className="text-muted-foreground">₦1,000</p>
                      <p className="text-xs text-green-600">Save ₦250!</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Custom Amount</label>
                    <Input
                      type="number"
                      placeholder="Enter coin amount (min. 100)"
                      value={purchaseAmount}
                      onChange={(e) => setPurchaseAmount(e.target.value)}
                      min="100"
                    />
                    {purchaseAmount && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Cost: ₦{Math.floor(Number.parseInt(purchaseAmount) / 2)}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handlePurchase()}
                    disabled={loading || !purchaseAmount}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    {loading ? "Processing..." : "Purchase Coins"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-6">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Withdraw Coins
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Wallet className="h-4 w-4" />
                  <AlertDescription>
                    Convert your Erigga Coins back to cash. Minimum withdrawal is 500 coins (₦250).
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Withdrawal Amount</label>
                    <Input
                      type="number"
                      placeholder="Enter coin amount (min. 500)"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      min="500"
                      max={profile?.coins || 0}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Available: {profile?.coins?.toLocaleString() || 0} coins
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <h4 className="font-medium mb-2">Withdrawal Details</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Coins to withdraw:</span>
                        <span>{withdrawAmount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conversion rate:</span>
                        <span>2 coins = ₦1</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processing fee:</span>
                        <span>₦10</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-1">
                        <span>You'll receive:</span>
                        <span>
                          ₦{withdrawAmount ? Math.max(0, Math.floor(Number.parseInt(withdrawAmount) / 2) - 10) : 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleWithdraw}
                    disabled={loading || !withdrawAmount || Number.parseInt(withdrawAmount) > (profile?.coins || 0)}
                    className="w-full"
                    variant="outline"
                  >
                    {loading ? "Processing..." : "Request Withdrawal"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
