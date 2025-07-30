"use client"

import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coins, CreditCard, ArrowUpRight, ArrowDownLeft, Gift, Star, Crown, Zap, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function CoinsPage() {
  const { profile, isLoading } = useAuth()

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AuthGuard>
    )
  }

  const coinPackages = [
    {
      id: 1,
      name: "Starter Pack",
      coins: 500,
      price: 1000,
      bonus: 0,
      popular: false,
      icon: <Coins className="w-6 h-6" />,
      color: "from-gray-500 to-gray-600",
    },
    {
      id: 2,
      name: "Popular Pack",
      coins: 1200,
      price: 2000,
      bonus: 200,
      popular: true,
      icon: <Star className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600",
    },
    {
      id: 3,
      name: "Premium Pack",
      coins: 2500,
      price: 4000,
      bonus: 500,
      popular: false,
      icon: <Crown className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600",
    },
    {
      id: 4,
      name: "Ultimate Pack",
      coins: 5500,
      price: 8000,
      bonus: 1500,
      popular: false,
      icon: <Zap className="w-6 h-6" />,
      color: "from-yellow-500 to-yellow-600",
    },
  ]

  const recentTransactions = [
    {
      id: 1,
      type: "earned",
      amount: 50,
      description: "Daily login bonus",
      date: "2024-01-15",
      icon: <Gift className="w-4 h-4 text-green-600" />,
    },
    {
      id: 2,
      type: "spent",
      amount: -100,
      description: "Exclusive content unlock",
      date: "2024-01-14",
      icon: <ArrowDownLeft className="w-4 h-4 text-red-600" />,
    },
    {
      id: 3,
      type: "earned",
      amount: 25,
      description: "Community post upvote",
      date: "2024-01-13",
      icon: <TrendingUp className="w-4 h-4 text-green-600" />,
    },
    {
      id: 4,
      type: "purchased",
      amount: 1000,
      description: "Coin package purchase",
      date: "2024-01-12",
      icon: <ArrowUpRight className="w-4 h-4 text-blue-600" />,
    },
  ]

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Erigga Coins</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Earn, purchase, and spend coins for exclusive experiences and content
            </p>
          </div>

          {/* Balance Card */}
          <Card className="mb-8 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 mb-2">Your Balance</p>
                  <div className="flex items-center space-x-2">
                    <Coins className="w-8 h-8" />
                    <span className="text-4xl font-bold">{profile?.coins_balance?.toLocaleString() || "0"}</span>
                  </div>
                  <p className="text-purple-100 mt-2">Erigga Coins</p>
                </div>
                <div className="text-right">
                  <Button variant="secondary" asChild>
                    <Link href="/coins/history">View History</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="purchase" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="purchase">Purchase Coins</TabsTrigger>
              <TabsTrigger value="earn">Earn Coins</TabsTrigger>
              <TabsTrigger value="spend">Spend Coins</TabsTrigger>
            </TabsList>

            <TabsContent value="purchase" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {coinPackages.map((pkg) => (
                  <Card key={pkg.id} className={`relative ${pkg.popular ? "ring-2 ring-purple-500" : ""}`}>
                    {pkg.popular && (
                      <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white">
                        Most Popular
                      </Badge>
                    )}
                    <CardHeader className="text-center">
                      <div
                        className={`w-16 h-16 bg-gradient-to-r ${pkg.color} rounded-full flex items-center justify-center mx-auto mb-4 text-white`}
                      >
                        {pkg.icon}
                      </div>
                      <CardTitle>{pkg.name}</CardTitle>
                      <CardDescription>
                        {pkg.coins.toLocaleString()} coins
                        {pkg.bonus > 0 && <span className="text-green-600 font-medium"> + {pkg.bonus} bonus</span>}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        ₦{pkg.price.toLocaleString()}
                      </div>
                      <Button className="w-full" variant={pkg.popular ? "default" : "outline"}>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Purchase
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="earn" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                      <Gift className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle>Daily Login</CardTitle>
                    <CardDescription>Earn 50 coins every day you log in</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Claim Daily Bonus</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                      <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle>Community Engagement</CardTitle>
                    <CardDescription>Earn coins for posts, comments, and upvotes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <Link href="/community">Join Community</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                      <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle>Referral Program</CardTitle>
                    <CardDescription>Earn 100 coins for each friend you refer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full bg-transparent">
                      Invite Friends
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="spend" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
                      <Crown className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <CardTitle>Exclusive Content</CardTitle>
                    <CardDescription>Unlock premium tracks and videos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium">Starting from</span>
                      <div className="flex items-center">
                        <Coins className="w-4 h-4 mr-1" />
                        <span>50 coins</span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <Link href="/vault">Browse Content</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                      <Star className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle>Merchandise</CardTitle>
                    <CardDescription>Get exclusive Erigga merchandise</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium">Starting from</span>
                      <div className="flex items-center">
                        <Coins className="w-4 h-4 mr-1" />
                        <span>500 coins</span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <Link href="/merch">Shop Now</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                      <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <CardTitle>Meet & Greet</CardTitle>
                    <CardDescription>Book exclusive sessions with Erigga</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium">Starting from</span>
                      <div className="flex items-center">
                        <Coins className="w-4 h-4 mr-1" />
                        <span>2000 coins</span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <Link href="/meet-greet">Book Session</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Recent Transactions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest coin activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center">
                        {transaction.icon}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{transaction.date}</p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center font-bold ${
                        transaction.amount > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      <Coins className="w-4 h-4 mr-1" />
                      <span>
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
