"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { CoinPurchaseEnhanced } from "@/components/coin-purchase-enhanced"
import { CoinWithdrawalEnhanced } from "@/components/coin-withdrawal-enhanced"
import { CoinBalance } from "@/components/coin-balance"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CoinsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Erigga Coins</h1>
            <p className="text-muted-foreground">Manage your Erigga coins and transactions</p>
          </div>
          <CoinBalance size="lg" />
        </div>

        <Tabs defaultValue="purchase" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="purchase">Purchase Coins</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw Coins</TabsTrigger>
          </TabsList>

          <TabsContent value="purchase">
            <CoinPurchaseEnhanced />
          </TabsContent>

          <TabsContent value="withdraw">
            <CoinWithdrawalEnhanced />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
