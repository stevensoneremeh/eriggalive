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
  ShoppingCart,
} from "lucide-react"
import { toast } from "sonner"
import { AuthGuard } from "@/components/auth-guard"

interface Transaction {
  id: string
  type: "earned" | "spent" | "purchased" | "withdrawn"
  amount: number
  description: string
  created_at: string
  status: "completed" | "pending" | "failed"
  reference?: string
}

interface CoinPackage {
  id: string
  coins: number
  price: number
  bonus?: number
  popular?: boolean
  savings?: number
}

// Declare Paystack global
declare global {
  interface Window {
    PaystackPop: any
  }
}

const coinPackages: CoinPackage[] = [
  {
    id: "basic",
    coins: 500,
    price: 250,
    savings: 0,
  },
  {
    id: "popular",
    coins: 1000,
    price: 450,
    bonus: 100,
    popular: true,
    savings: 50,
  },
  {
    id: "premium",
    coins: 2500,
    price: 1000,
    bonus: 500,
    savings: 250,
  },
  {
    id: "elite",
    coins: 5000,
    price: 1800,
    bonus: 1200,
    savings: 700,
  },
]

export default function CoinsPage() {
  const { user, profile, loading, updateCoins } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [customAmount, setCustomAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [processingPayment, setProcessingPayment] = useState(false)
  const [loadingTransactions, setLoadingTransactions] = useState(true)
  const [realTimeBalance, setRealTimeBalance] = useState(0)
  const supabase = createClient()

  // Mock transactions for demonstration
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
      description: "Coin purchase - ₦450",
      created_at: new Date(Date.now() - 172800000).toISOString(),
      status: "completed",
      reference: "TXN_123456789",
    },
    {
      id: "4",
      type: "withdrawn",
      amount: -200,
      description: "Withdrawal to bank account",
      created_at: new Date(Date.now() - 259200000).toISOString(),
      status: "completed",
    },
  ]

  useEffect(() => {
    if (user && profile) {
      setRealTimeBalance(profile.coins_balance || 0)
      loadTransactions()
    }
  }, [user, profile])

  useEffect(() => {
    // Load Paystack script
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
      setLoadingTransactions(true)
      // For now, use mock data
      setTransactions(mockTransactions)
    } catch (error) {
      console.error("Error loading transactions:", error)
      setTransactions(mockTransactions)
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handlePurchaseCoins = async (packageData: CoinPackage) => {
    if (!user || !profile) {
      toast.error("Please sign in to purchase coins")
      return
    }

    setProcessingPayment(true)

    try {
      if (!window.PaystackPop) {
        throw new Error("Paystack not loaded. Please refresh and try again.")
      }

      const totalCoins = packageData.coins + (packageData.bonus || 0)
      const reference = `ERIGGA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_dummy_key_for_demo",
        email: user.email!,
        amount: packageData.price * 100, // Convert to kobo
        currency: "NGN",
        ref: reference,
        metadata: {
          custom_fields: [
            {
              display_name: "Package",
              variable_name: "package_id",
              value: packageData.id,
            },
            {
              display_name: "Coins",
              variable_name: "coin_amount",
              value: totalCoins.toString(),
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
                Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              },
              body: JSON.stringify({
                reference: response.reference,
                amount: packageData.price,
                coins: totalCoins,
                package_id: packageData.id,
              }),
            })

            if (!verifyResponse.ok) {
              const error = await verifyResponse.json()
              throw new Error(error.error || "Payment verification failed")
            }

            const result = await verifyResponse.json()

            // Update local balance
            await updateCoins(totalCoins)
            setRealTimeBalance((prev) => prev + totalCoins)

            // Add transaction to list
            const newTransaction: Transaction = {
              id: reference,
              type: "purchased",
              amount: totalCoins,
              description: `Coin purchase - ₦${packageData.price}`,
              created_at: new Date().toISOString(),
              status: "completed",
              reference: response.reference,
            }
            setTransactions((prev) => [newTransaction, ...prev])

            toast.success(`Successfully purchased ${totalCoins.toLocaleString()} Erigga Coins!`)
          } catch (error: any) {
            console.error("Payment verification error:", error)
            toast.error(error.message || "Payment completed but verification failed. Please contact support.")
          }
        },
        onClose: () => {
          setProcessingPayment(false)
        },
      })

      handler.openIframe()
    } catch (error: any) {
      console.error("Payment error:", error)
      toast.error(error.message || "Failed to initialize payment. Please try again.")
      setProcessingPayment(false)
    }
  }

  const handleCustomPurchase = async () => {
    const amount = Number.parseInt(customAmount)
    if (!amount || amount < 100) {
      toast.error("Minimum purchase is 100 coins")
      return
    }

    const price = Math.floor(amount * 0.5) // 2 coins per naira
    const customPackage: CoinPackage = {
      id: "custom",
      coins: amount,
      price,
    }

    await handlePurchaseCoins(customPackage)
    setCustomAmount("")
  }

  const handleWithdraw = async () => {
    const amount = Number.parseInt(withdrawAmount)
    if (!amount || amount < 500) {
      toast.error("Minimum withdrawal is 500 coins")
      return
    }

    if (amount > realTimeBalance) {
      toast.error("Insufficient coin balance")
      return
    }

    try {
      // Simulate withdrawal process
      const nairaValue = Math.floor(amount / 2) - 10 // Processing fee

      // Update balance
      await updateCoins(-amount)
      setRealTimeBalance((prev) => prev - amount)

      // Add transaction
      const newTransaction: Transaction = {
        id: `withdraw_${Date.now()}`,
        type: "withdrawn",
        amount: -amount,
        description: `Withdrawal to bank - ₦${nairaValue}`,
        created_at: new Date().toISOString(),
        status: "pending",
      }
      setTransactions((prev) => [newTransaction, ...prev])

      toast.success(`Withdrawal request for ${amount} coins submitted! You'll receive ₦${nairaValue}.`)
      setWithdrawAmount("")
    } catch (error) {
      toast.error("Withdrawal failed. Please try again.")
      console.error("Withdrawal error:", error)
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

  if (loading) {
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

  return (
    <AuthGuard requireAuth>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-full text-lg font-bold mb-6 shadow-lg">
              <Coins className="h-6 w-6" />
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
          <Card className="mb-8 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('/placeholder.svg?height=300&width=800')] opacity-10"></div>
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-lg mb-2">Current Balance</p>
                  <div className="flex items-center gap-3">
                    <Coins className="h-10 w-10" />
                    <span className="text-5xl font-bold">{realTimeBalance.toLocaleString()}</span>
                    <span className="text-2xl">Coins</span>
                  </div>
                  <p className="text-yellow-100 mt-2">≈ ₦{Math.floor(realTimeBalance / 2).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-yellow-100 mb-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>This Month</span>
                  </div>
                  <p className="text-3xl font-bold">+{Math.floor(Math.random() * 500 + 200)}</p>
                  <div className="flex items-center gap-1 text-sm text-yellow-100">
                    <span>Exchange Rate: 2 coins = ₦1</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                  <Gift className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">+{Math.floor(Math.random() * 100 + 50)}</p>
                <p className="text-sm text-muted-foreground">Earned Today</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-600">{Math.floor(Math.random() * 10 + 5)}</p>
                <p className="text-sm text-muted-foreground">Actions Today</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-4">
                  <Crown className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-600">{profile?.subscription_tier || "Grassroot"}</p>
                <p className="text-sm text-muted-foreground">Current Tier</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full mb-4">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-orange-600">{Math.floor(Math.random() * 5 + 1)}</p>
                <p className="text-sm text-muted-foreground">Streak Days</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="purchase" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="purchase" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Purchase
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Withdraw
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

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
                      Purchase Erigga Coins securely with Paystack. Coins can be used to vote, access premium content,
                      and more.
                    </AlertDescription>
                  </Alert>

                  {/* Coin Packages */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {coinPackages.map((pkg) => (
                      <Card
                        key={pkg.id}
                        className={`relative hover:shadow-lg transition-all cursor-pointer ${
                          pkg.popular
                            ? "border-2 border-primary bg-primary/5"
                            : "border-2 border-dashed border-gray-300 hover:border-primary"
                        }`}
                      >
                        {pkg.popular && (
                          <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                            Most Popular
                          </Badge>
                        )}
                        <CardContent className="p-6 text-center">
                          <Coins className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                          <p className="font-bold text-xl">{pkg.coins.toLocaleString()} Coins</p>
                          {pkg.bonus && <p className="text-sm text-green-600 font-medium">+{pkg.bonus} Bonus!</p>}
                          <p className="text-lg font-semibold text-primary mt-2">₦{pkg.price.toLocaleString()}</p>
                          {pkg.savings > 0 && <p className="text-xs text-green-600">Save ₦{pkg.savings}!</p>}
                          <Button
                            onClick={() => handlePurchaseCoins(pkg)}
                            disabled={processingPayment}
                            className="w-full mt-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                          >
                            {processingPayment ? "Processing..." : "Purchase"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Custom Amount</h3>
                    <div className="flex gap-4">
                      <Input
                        type="number"
                        placeholder="Enter coin amount (min. 100)"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        min="100"
                        className="flex-1"
                      />
                      <div className="flex items-center px-3 bg-muted rounded-md">
                        <span className="text-sm">≈ ₦{Math.floor(Number.parseInt(customAmount || "0") * 0.5)}</span>
                      </div>
                    </div>
                    <Button
                      onClick={handleCustomPurchase}
                      disabled={processingPayment || !customAmount || Number.parseInt(customAmount) < 100}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    >
                      {processingPayment ? "Processing..." : "Purchase Custom Amount"}
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
                      Convert your Erigga Coins back to cash. Minimum withdrawal is 500 coins. Processing fee: ₦10.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Withdrawal Amount (Coins)</label>
                      <Input
                        type="number"
                        placeholder="Enter coin amount (min. 500)"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        min="500"
                        max={realTimeBalance}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Available: {realTimeBalance.toLocaleString()} coins
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <h4 className="font-medium mb-2">Withdrawal Summary</h4>
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
                      disabled={
                        !withdrawAmount ||
                        Number.parseInt(withdrawAmount) > realTimeBalance ||
                        Number.parseInt(withdrawAmount) < 500
                      }
                      className="w-full"
                      variant="outline"
                    >
                      Request Withdrawal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Transaction History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingTransactions ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-muted-foreground">Loading transactions...</p>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <Coins className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                      <p className="text-muted-foreground">
                        Start earning or purchasing coins to see your transaction history!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-3">
                            {getTransactionIcon(transaction.type)}
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground">
                                  {new Date(transaction.created_at).toLocaleDateString()} at{" "}
                                  {new Date(transaction.created_at).toLocaleTimeString()}
                                </p>
                                {transaction.reference && (
                                  <Badge variant="outline" className="text-xs">
                                    {transaction.reference}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-lg ${getTransactionColor(transaction.type)}`}>
                              {transaction.amount > 0 ? "+" : ""}
                              {transaction.amount.toLocaleString()} coins
                            </p>
                            <Badge
                              variant={
                                transaction.status === "completed"
                                  ? "default"
                                  : transaction.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="text-xs"
                            >
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
          </Tabs>

          {/* Coin Usage Guide */}
          <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                How to Use Your Coins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-3">
                    <ArrowUpRight className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Vote & Interact</h3>
                  <p className="text-sm text-muted-foreground">
                    Use coins to vote on community posts and support your favorite content creators.
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-3">
                    <Crown className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Premium Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Unlock exclusive content, early access to music, and premium features.
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full mb-3">
                    <ShoppingCart className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Shop Merch</h3>
                  <p className="text-sm text-muted-foreground">
                    Purchase exclusive merchandise and collectibles using your coins.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
