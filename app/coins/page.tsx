"use client"

<<<<<<< HEAD
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Coins,
  Minus,
  CreditCard,
  Smartphone,
  DollarSign,
  History,
  Star,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"

interface Transaction {
  id: string
  type: "purchase" | "withdrawal" | "reward" | "content_access" | "refund" | "bonus"
  amount: number
  description: string
  status: "completed" | "pending" | "failed"
  created_at: string
  reference?: string
}

interface CoinPackage {
  id: string
  name: string
  coins: number
  price: number
  currency: string
  bonus_coins: number
  popular: boolean
  description: string
}

export default function CoinsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawLoading, setWithdrawLoading] = useState(false)

  const coinPackages: CoinPackage[] = [
    {
      id: "starter",
      name: "Starter Pack",
      coins: 100,
      price: 500,
      currency: "NGN",
      bonus_coins: 0,
      popular: false,
      description: "Perfect for trying out premium content",
    },
    {
      id: "popular",
      name: "Popular Pack",
      coins: 500,
      price: 2000,
      currency: "NGN",
      bonus_coins: 50,
      popular: true,
      description: "Most popular choice with bonus coins",
    },
    {
      id: "premium",
      name: "Premium Pack",
      coins: 1000,
      price: 3500,
      currency: "NGN",
      bonus_coins: 150,
      popular: false,
      description: "Best value with maximum bonus",
    },
    {
      id: "ultimate",
      name: "Ultimate Pack",
      coins: 2500,
      price: 8000,
      currency: "NGN",
      bonus_coins: 500,
      popular: false,
      description: "For the ultimate fan experience",
    },
  ]

  useEffect(() => {
    // Mock transaction data
    const mockTransactions: Transaction[] = [
      {
        id: "1",
        type: "purchase",
        amount: 500,
        description: "Purchased Popular Pack",
        status: "completed",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        reference: "TXN_001",
      },
      {
        id: "2",
        type: "content_access",
        amount: -50,
        description: "Unlocked Behind the Scenes Video",
        status: "completed",
        created_at: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: "3",
        type: "reward",
        amount: 25,
        description: "Daily login bonus",
        status: "completed",
        created_at: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        id: "4",
        type: "withdrawal",
        amount: -200,
        description: "Withdrawal to bank account",
        status: "pending",
        created_at: new Date(Date.now() - 345600000).toISOString(),
        reference: "WTH_001",
      },
    ]

    setTransactions(mockTransactions)
    setLoading(false)
  }, [])

  const handlePurchase = async (packageData: CoinPackage) => {
    setPurchaseLoading(true)

    try {
      // In a real implementation, this would integrate with Paystack or Flutterwave
      // For now, we'll simulate a successful purchase
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: "purchase",
        amount: packageData.coins + packageData.bonus_coins,
        description: `Purchased ${packageData.name}`,
        status: "completed",
        created_at: new Date().toISOString(),
        reference: `TXN_${Date.now()}`,
      }

      setTransactions((prev) => [newTransaction, ...prev])

      // Update user coins (in real app, this would be handled by the backend)
      if (profile) {
        await supabase
          .from("users")
          .update({
            coins: (profile.coins || 0) + packageData.coins + packageData.bonus_coins,
          })
          .eq("id", profile.id)

        await refreshProfile()
      }

      toast({
        title: "Purchase Successful!",
        description: `You've received ${packageData.coins + packageData.bonus_coins} coins`,
      })
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setPurchaseLoading(false)
    }
  }

  const handleWithdrawal = async () => {
    const amount = Number.parseInt(withdrawAmount)
    if (!amount || amount <= 0 || amount > (profile?.coins || 0)) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      })
      return
    }

    setWithdrawLoading(true)

    try {
      // Simulate withdrawal process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: "withdrawal",
        amount: -amount,
        description: `Withdrawal to bank account`,
        status: "pending",
        created_at: new Date().toISOString(),
        reference: `WTH_${Date.now()}`,
      }

      setTransactions((prev) => [newTransaction, ...prev])
      setWithdrawAmount("")

      toast({
        title: "Withdrawal Initiated",
        description: "Your withdrawal request is being processed",
      })
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setWithdrawLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
      case "reward":
      case "bonus":
        return <ArrowUpRight className="w-4 h-4 text-green-600" />
      case "withdrawal":
      case "content_access":
        return <ArrowDownLeft className="w-4 h-4 text-red-600" />
      default:
        return <Coins className="w-4 h-4 text-gray-600" />
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
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Erigga Coins</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your coins, purchase packages, and track your transactions
            </p>
          </div>

          {/* Balance Card */}
          <Card className="mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 mb-1">Current Balance</p>
                  <p className="text-3xl font-bold flex items-center">
                    <Coins className="w-8 h-8 mr-2" />
                    {(profile?.coins || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-100 mb-1">Tier</p>
                  <Badge className="bg-white text-orange-600">
                    {profile?.tier?.replace("_", " ").toUpperCase() || "GRASSROOT"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="purchase" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="purchase">Purchase Coins</TabsTrigger>
              <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
              <TabsTrigger value="history">Transaction History</TabsTrigger>
            </TabsList>

            {/* Purchase Tab */}
            <TabsContent value="purchase" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {coinPackages.map((pkg) => (
                  <Card key={pkg.id} className={`relative ${pkg.popular ? "ring-2 ring-purple-500" : ""}`}>
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-purple-500 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <CardDescription>{pkg.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <div>
                        <p className="text-3xl font-bold text-purple-600">{pkg.coins.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">coins</p>
                        {pkg.bonus_coins > 0 && (
                          <p className="text-sm text-green-600 font-medium">+{pkg.bonus_coins} bonus coins</p>
                        )}
                      </div>
                      <div>
                        <p className="text-2xl font-bold">₦{pkg.price.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">
                          ₦{(pkg.price / (pkg.coins + pkg.bonus_coins)).toFixed(2)} per coin
                        </p>
                      </div>
                      <Button className="w-full" onClick={() => handlePurchase(pkg)} disabled={purchaseLoading}>
                        <CreditCard className="w-4 h-4 mr-2" />
                        {purchaseLoading ? "Processing..." : "Purchase"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Choose your preferred payment method</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="font-medium">Card Payment</p>
                        <p className="text-sm text-gray-500">Visa, Mastercard, Verve</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <Smartphone className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-medium">Mobile Money</p>
                        <p className="text-sm text-gray-500">MTN, Airtel, Glo, 9mobile</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <DollarSign className="w-6 h-6 text-purple-600" />
                      <div>
                        <p className="font-medium">Bank Transfer</p>
                        <p className="text-sm text-gray-500">Direct bank transfer</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Withdraw Tab */}
            <TabsContent value="withdraw" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Withdraw Coins</CardTitle>
                    <CardDescription>Convert your coins back to cash (Minimum: 100 coins)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Amount to withdraw</label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        max={profile?.coins || 0}
                        min={100}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Available: {(profile?.coins || 0).toLocaleString()} coins
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm">
                        <strong>Conversion Rate:</strong> 1 coin = ₦2.50
                      </p>
                      <p className="text-sm">
                        <strong>You'll receive:</strong> ₦
                        {((Number.parseInt(withdrawAmount) || 0) * 2.5).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Processing fee: ₦50 (deducted from withdrawal amount)
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleWithdrawal}
                      disabled={withdrawLoading || !withdrawAmount || Number.parseInt(withdrawAmount) < 100}
                    >
                      <Minus className="w-4 h-4 mr-2" />
                      {withdrawLoading ? "Processing..." : "Withdraw"}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Withdrawal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Minimum withdrawal:</span>
                        <span className="text-sm font-medium">100 coins</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Processing time:</span>
                        <span className="text-sm font-medium">1-3 business days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Processing fee:</span>
                        <span className="text-sm font-medium">₦50</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Daily limit:</span>
                        <span className="text-sm font-medium">5,000 coins</span>
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Note:</strong> Withdrawals are processed to your registered bank account. Make sure your
                        account details are up to date in your profile settings.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <History className="w-5 h-5 mr-2" />
                    Transaction History
                  </CardTitle>
                  <CardDescription>View all your coin transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="text-gray-600 dark:text-gray-300 mt-2">Loading transactions...</p>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No transactions yet</h3>
                      <p className="text-gray-600 dark:text-gray-300">Your transaction history will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getTransactionIcon(transaction.type)}
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(transaction.created_at).toLocaleDateString()} at{" "}
                                {new Date(transaction.created_at).toLocaleTimeString()}
                              </p>
                              {transaction.reference && (
                                <p className="text-xs text-gray-400">Ref: {transaction.reference}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                              {transaction.amount > 0 ? "+" : ""}
                              {transaction.amount.toLocaleString()} coins
                            </p>
                            <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
=======
import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CoinPurchaseEnhanced } from "@/components/coin-purchase-enhanced"
import { CoinWithdrawalEnhanced } from "@/components/coin-withdrawal-enhanced"
import { Coins, TrendingUp, TrendingDown, History, Shield } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function CoinsPage() {
  const { profile, isAuthenticated, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState("purchase")

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please log in to view your coins.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Erigga Coins Management</h1>
          <p className="text-muted-foreground">Buy and withdraw your Erigga Coins securely</p>
        </div>

        {/* Balance Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Coins className="h-6 w-6 text-yellow-500 mr-2" />
                Your Balance
              </div>
              <span className="text-3xl font-bold text-yellow-600">{profile?.coins?.toLocaleString() || "0"}</span>
            </CardTitle>
            <CardDescription>Current value: ₦{((profile?.coins || 0) * 0.5).toLocaleString()}</CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="purchase" className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Purchase Coins
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex items-center">
              <TrendingDown className="h-4 w-4 mr-2" />
              Withdraw Coins
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchase" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Erigga Coins</CardTitle>
                <CardDescription>Buy Erigga Coins to unlock exclusive content and features</CardDescription>
              </CardHeader>
              <CardContent>
                <CoinPurchaseEnhanced
                  onSuccess={(transaction) => {
                    console.log("Purchase successful:", transaction)
                  }}
                  onError={(error) => {
                    console.error("Purchase error:", error)
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Withdraw Erigga Coins</CardTitle>
                <CardDescription>
                  Convert your Erigga Coins back to Naira and withdraw to your bank account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CoinWithdrawalEnhanced
                  onSuccess={(withdrawal) => {
                    console.log("Withdrawal successful:", withdrawal)
                  }}
                  onError={(error) => {
                    console.error("Withdrawal error:", error)
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Information Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-500" />
                Security & Safety
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• All transactions are encrypted and secure</p>
              <p>• Powered by Paystack payment gateway</p>
              <p>• Your financial information is never stored</p>
              <p>• 24/7 fraud monitoring and protection</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2 text-blue-500" />
                Transaction Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Purchases are instant and automatic</p>
              <p>• Withdrawals take 1-3 business days</p>
              <p>• Minimum withdrawal: 10,000 coins</p>
              <p>• Processing fee: 1% (minimum ₦25)</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
>>>>>>> new
  )
}
