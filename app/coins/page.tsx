"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
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
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Erigga Coins</h1>
          <p className="text-muted-foreground mb-8">Please log in to manage your Erigga Coins</p>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>You need to be logged in to purchase or withdraw Erigga Coins.</AlertDescription>
          </Alert>
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
  )
}
