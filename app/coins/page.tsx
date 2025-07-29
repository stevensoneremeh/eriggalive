"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Coins,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  Zap,
  TrendingUp,
  Wallet,
  History,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Star,
} from "lucide-react"
import { toast } from "sonner"

interface CoinPackage {
  id: string
  coins: number
  price: number
  bonus: number
  popular?: boolean
  savings?: string
}

interface Transaction {
  id: string
  type: "purchase" | "withdrawal" | "earned" | "spent"
  amount: number
  coins: number
  status: "completed" | "pending" | "failed"
  description: string
  reference?: string
  created_at: string
}

function CoinsContent() {
  const { profile, updateCoins, refreshProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [customAmount, setCustomAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null)

  // Current coin value in Naira
  const coinValue = 0.5 // 1 coin = ₦0.50

  const coinPackages: CoinPackage[] = [
    {
      id: "starter",
      coins: 100,
      price: 50,
      bonus: 0,
    },
    {
      id: "basic",
      coins: 500,
      price: 200,
      bonus: 50,
      savings: "Save ₦50",
    },
    {
      id: "popular",
      coins: 1000,
      price: 350,
      bonus: 150,
      popular: true,
      savings: "Save ₦150",
    },
    {
      id: "premium",
      coins: 2500,
      price: 800,
      bonus: 500,
      savings: "Save ₦450",
    },
    {
      id: "ultimate",
      coins: 5000,
      price: 1500,
      bonus: 1500,
      savings: "Save ₦1000",
    },
  ]

  // Mock transactions for demo
  useEffect(() => {
    const mockTransactions: Transaction[] = [
      {
        id: "1",
        type: "purchase",
        amount: 350,
        coins: 1150,
        status: "completed",
        description: "Purchased Popular Package",
        reference: "PAY_123456789",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: "2",
        type: "earned",
        amount: 0,
        coins: 50,
        status: "completed",
        description: "Community engagement reward",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        id: "3",
        type: "spent",
        amount: 0,
        coins: -25,
        status: "completed",
        description: "Meet & Greet session booking",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      },
      {
        id: "4",
        type: "withdrawal",
        amount: 100,
        coins: -200,
        status: "pending",
        description: "Withdrawal to bank account",
        reference: "WTH_987654321",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      },
    ]
    setTransactions(mockTransactions)
  }, [])

  const handlePaystackPayment = async (packageData: CoinPackage) => {
    if (!profile?.email) {
      toast.error("Profile information missing")
      return
    }

    setIsLoading(true)
    setSelectedPackage(packageData)

    try {
      // Initialize Paystack payment
      const handler = (window as any).PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_demo", // Use demo key for preview
        email: profile.email,
        amount: packageData.price * 100, // Convert to kobo
        currency: "NGN",
        ref: `COIN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          custom_fields: [
            {
              display_name: "Coin Package",
              variable_name: "coin_package",
              value: packageData.id,
            },
            {
              display_name: "Coins",
              variable_name: "coins",
              value: packageData.coins + packageData.bonus,
            },
          ],
        },
        callback: async (response: any) => {
          console.log("Payment successful:", response)

          // Verify payment on server
          try {
            const verifyResponse = await fetch("/api/coins/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                reference: response.reference,
                packageId: packageData.id,
              }),
            })

            if (verifyResponse.ok) {
              const totalCoins = packageData.coins + packageData.bonus
              updateCoins(totalCoins)

              // Add transaction to history
              const newTransaction: Transaction = {
                id: Date.now().toString(),
                type: "purchase",
                amount: packageData.price,
                coins: totalCoins,
                status: "completed",
                description: `Purchased ${packageData.id} package`,
                reference: response.reference,
                created_at: new Date().toISOString(),
              }
              setTransactions((prev) => [newTransaction, ...prev])

              toast.success(`Successfully purchased ${totalCoins} coins!`)
              setShowPaymentDialog(false)
            } else {
              toast.error("Payment verification failed")
            }
          } catch (error) {
            console.error("Payment verification error:", error)
            toast.error("Payment verification failed")
          }
        },
        onClose: () => {
          console.log("Payment dialog closed")
          setIsLoading(false)
        },
      })

      handler.openIframe()
    } catch (error) {
      console.error("Payment initialization error:", error)
      toast.error("Failed to initialize payment")
      setIsLoading(false)
    }
  }

  const handleCustomPayment = async () => {
    const amount = Number.parseFloat(customAmount)
    if (!amount || amount < 10) {
      toast.error("Minimum purchase amount is ₦10")
      return
    }

    const coins = Math.floor(amount / coinValue)
    const customPackage: CoinPackage = {
      id: "custom",
      coins,
      price: amount,
      bonus: 0,
    }

    await handlePaystackPayment(customPackage)
  }

  const handleWithdrawal = async () => {
    const coins = Number.parseInt(withdrawAmount)
    if (!coins || coins < 100) {
      toast.error("Minimum withdrawal is 100 coins")
      return
    }

    if (coins > (profile?.coins_balance || 0)) {
      toast.error("Insufficient coin balance")
      return
    }

    setIsLoading(true)

    try {
      // Simulate withdrawal processing
      const withdrawalFee = Math.ceil(coins * 0.05) // 5% fee
      const netCoins = coins - withdrawalFee
      const amount = netCoins * coinValue

      // Update local state
      updateCoins(-coins)

      // Add transaction
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: "withdrawal",
        amount,
        coins: -coins,
        status: "pending",
        description: `Withdrawal to bank account (Fee: ${withdrawalFee} coins)`,
        reference: `WTH_${Date.now()}`,
        created_at: new Date().toISOString(),
      }
      setTransactions((prev) => [newTransaction, ...prev])

      toast.success(`Withdrawal request submitted! You'll receive ₦${amount.toFixed(2)} after processing.`)
      setWithdrawAmount("")
    } catch (error) {
      console.error("Withdrawal error:", error)
      toast.error("Withdrawal failed")
    } finally {
      setIsLoading(false)
    }
  }

  const getTransactionIcon = (transaction: Transaction) => {
    switch (transaction.type) {
      case "purchase":
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />
      case "withdrawal":
        return <ArrowUpRight className="w-4 h-4 text-red-500" />
      case "earned":
        return <Gift className="w-4 h-4 text-blue-500" />
      case "spent":
        return <Zap className="w-4 h-4 text-orange-500" />
      default:
        return <Coins className="w-4 h-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Erigga Coins</h1>
          <p className="text-gray-600">Manage your coins, make purchases, and track transactions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Balance & Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Current Balance */}
            <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Wallet className="w-5 h-5" />
                  Current Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">{profile.coins_balance.toLocaleString()}</div>
                <p className="text-yellow-100 text-sm mb-4">
                  ≈ ₦{(profile.coins_balance * coinValue).toLocaleString()} NGN
                </p>
                <div className="flex items-center gap-2 text-yellow-100 text-xs">
                  <TrendingUp className="w-4 h-4" />
                  <span>1 coin = ₦{coinValue}</span>
                </div>
              </CardContent>
            </Card>

            {/* Coin Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  How to Use Coins
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Meet & Greet Sessions</p>
                    <p className="text-xs text-muted-foreground">Book exclusive sessions</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Gift className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Exclusive Merchandise</p>
                    <p className="text-xs text-muted-foreground">Purchase limited items</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Premium Content</p>
                    <p className="text-xs text-muted-foreground">Access exclusive media</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Community Features</p>
                    <p className="text-xs text-muted-foreground">Boost posts & more</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Earning Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Earn Free Coins
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <p className="font-medium">• Daily login bonus: 10 coins</p>
                  <p className="font-medium">• Create posts: 5 coins each</p>
                  <p className="font-medium">• Receive upvotes: 2 coins each</p>
                  <p className="font-medium">• Comment engagement: 1 coin each</p>
                  <p className="font-medium">• Referral bonus: 100 coins</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Purchase & Transactions */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="purchase" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="purchase">Purchase Coins</TabsTrigger>
                <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                <TabsTrigger value="history">Transaction History</TabsTrigger>
              </TabsList>

              {/* Purchase Tab */}
              <TabsContent value="purchase" className="space-y-6">
                {/* Coin Packages */}
                <Card>
                  <CardHeader>
                    <CardTitle>Coin Packages</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Choose a package that suits your needs. Larger packages include bonus coins!
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {coinPackages.map((pkg) => (
                        <Card
                          key={pkg.id}
                          className={`relative cursor-pointer transition-all hover:shadow-lg ${
                            pkg.popular ? "ring-2 ring-primary" : ""
                          }`}
                          onClick={() => handlePaystackPayment(pkg)}
                        >
                          {pkg.popular && (
                            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                              Most Popular
                            </Badge>
                          )}
                          <CardContent className="p-6 text-center">
                            <div className="text-2xl font-bold mb-2">{pkg.coins.toLocaleString()}</div>
                            {pkg.bonus > 0 && (
                              <div className="text-sm text-green-600 font-medium mb-2">+{pkg.bonus} bonus coins</div>
                            )}
                            <div className="text-3xl font-bold text-primary mb-2">₦{pkg.price}</div>
                            {pkg.savings && (
                              <Badge variant="secondary" className="mb-4">
                                {pkg.savings}
                              </Badge>
                            )}
                            <Button className="w-full" disabled={isLoading}>
                              {isLoading && selectedPackage?.id === pkg.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : (
                                <CreditCard className="w-4 h-4 mr-2" />
                              )}
                              Buy Now
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Custom Amount */}
                <Card>
                  <CardHeader>
                    <CardTitle>Custom Amount</CardTitle>
                    <p className="text-sm text-muted-foreground">Purchase any amount of coins (minimum ₦10)</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label htmlFor="custom-amount">Amount (NGN)</Label>
                        <Input
                          id="custom-amount"
                          type="number"
                          placeholder="Enter amount"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          min="10"
                        />
                      </div>
                      <div className="flex-1">
                        <Label>Coins You'll Get</Label>
                        <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                          {customAmount
                            ? Math.floor(Number.parseFloat(customAmount) / coinValue).toLocaleString()
                            : "0"}{" "}
                          coins
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleCustomPayment} disabled={isLoading || !customAmount}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Purchase Custom Amount
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Withdraw Tab */}
              <TabsContent value="withdraw" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Withdraw Coins</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Convert your coins back to cash (minimum 100 coins, 5% processing fee)
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Withdrawals are processed within 24-48 hours. A 5% processing fee applies.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="withdraw-amount">Coins to Withdraw</Label>
                        <Input
                          id="withdraw-amount"
                          type="number"
                          placeholder="Enter coins"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          min="100"
                          max={profile.coins_balance}
                        />
                      </div>
                      <div>
                        <Label>You'll Receive</Label>
                        <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                          {withdrawAmount
                            ? `₦${(Number.parseInt(withdrawAmount) * 0.95 * coinValue).toFixed(2)}`
                            : "₦0.00"}
                        </div>
                      </div>
                    </div>

                    {withdrawAmount && Number.parseInt(withdrawAmount) >= 100 && (
                      <div className="text-sm text-muted-foreground">
                        <p>Processing fee: {Math.ceil(Number.parseInt(withdrawAmount) * 0.05)} coins</p>
                        <p>
                          Net coins:{" "}
                          {Number.parseInt(withdrawAmount) - Math.ceil(Number.parseInt(withdrawAmount) * 0.05)} coins
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleWithdrawal}
                      disabled={isLoading || !withdrawAmount || Number.parseInt(withdrawAmount) < 100}
                      className="w-full"
                    >
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      Request Withdrawal
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Transaction History Tab */}
              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Transaction History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactions.length === 0 ? (
                      <div className="text-center py-8">
                        <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No transactions yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {transactions.map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {getTransactionIcon(transaction)}
                              <div>
                                <p className="font-medium text-sm">{transaction.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(transaction.created_at).toLocaleDateString()}
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
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-semibold ${
                                    transaction.coins > 0 ? "text-green-600" : "text-red-600"
                                  }`}
                                >
                                  {transaction.coins > 0 ? "+" : ""}
                                  {transaction.coins} coins
                                </span>
                                {getStatusIcon(transaction.status)}
                              </div>
                              {transaction.amount > 0 && (
                                <p className="text-xs text-muted-foreground">₦{transaction.amount.toFixed(2)}</p>
                              )}
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
      </div>

      {/* Load Paystack Script */}
      <script src="https://js.paystack.co/v1/inline.js"></script>
    </div>
  )
}

export default function CoinsPage() {
  return (
    <AuthGuard>
      <CoinsContent />
    </AuthGuard>
  )
}
