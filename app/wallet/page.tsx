"use client"

import { AuthGuard } from "@/components/auth-guard"
import { WalletBalance } from "@/components/wallet/wallet-balance"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Coins, CreditCard, Gift } from "lucide-react"
import Link from "next/link"

export default function WalletPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center py-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Your Wallet
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your Erigga Coins and transactions</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Wallet Content */}
            <div className="lg:col-span-2">
              <WalletBalance />
            </div>

            {/* Sidebar Actions */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Coins className="h-5 w-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                  <CardDescription>Manage your coins</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full" variant="default">
                    <Link href="/coins/purchase">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Buy Coins
                    </Link>
                  </Button>
                  <Button asChild className="w-full bg-transparent" variant="outline">
                    <Link href="/premium">
                      <Gift className="h-4 w-4 mr-2" />
                      Upgrade Membership
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Coin Info */}
              <Card>
                <CardHeader>
                  <CardTitle>About Erigga Coins</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Use coins to access premium content</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Earn coins through membership bonuses</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span>Purchase merchandise with coins</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
