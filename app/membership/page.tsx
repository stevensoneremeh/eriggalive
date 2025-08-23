"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Crown, Calendar, CreditCard, History, Settings, Star, Zap, ArrowUpRight, Clock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { AnimatedTierCards } from "@/components/tier-system/animated-tier-cards"

interface MembershipTransaction {
  id: string
  from_tier: string
  to_tier: string
  duration_months: number
  amount_paid_naira?: number
  amount_paid_coins?: number
  payment_method: string
  starts_at: string
  expires_at: string
  status: string
  created_at: string
}

export default function MembershipPage() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState<MembershipTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchMembershipData = async () => {
      if (!profile?.id) return

      try {
        const { data, error } = await supabase
          .from("membership_transactions")
          .select("*")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })

        if (error) throw error
        setTransactions(data || [])
      } catch (error) {
        console.error("Error fetching membership data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMembershipData()
  }, [profile?.id, supabase])

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "free":
        return <Star className="h-5 w-5 text-gray-500" />
      case "pro":
        return <Crown className="h-5 w-5 text-blue-500" />
      case "enterprise":
        return <Zap className="h-5 w-5 text-purple-500" />
      default:
        return <Star className="h-5 w-5" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "free":
        return "bg-gray-100 text-gray-800"
      case "pro":
        return "bg-blue-100 text-blue-800"
      case "enterprise":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
  }

  const isExpiringSoon = () => {
    if (!profile?.membership_expires_at) return false
    const expiryDate = new Date(profile.membership_expires_at)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0
  }

  const isExpired = () => {
    if (!profile?.membership_expires_at) return false
    return new Date(profile.membership_expires_at) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Membership</h1>
          <p className="text-muted-foreground">Manage your subscription and benefits</p>
        </div>
      </div>

      {/* Current Membership Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Current Membership
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getTierIcon(profile?.membership_tier || "free")}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold capitalize">{profile?.membership_tier || "Free"} Tier</h3>
                  <Badge className={getTierColor(profile?.membership_tier || "free")}>
                    {profile?.membership_tier?.toUpperCase() || "FREE"}
                  </Badge>
                </div>
                {profile?.membership_expires_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {isExpired() ? "Expired on" : "Expires on"} {formatDate(profile.membership_expires_at)}
                    </span>
                    {isExpiringSoon() && (
                      <Badge variant="destructive" className="ml-2">
                        <Clock className="h-3 w-3 mr-1" />
                        Expiring Soon
                      </Badge>
                    )}
                    {isExpired() && (
                      <Badge variant="destructive" className="ml-2">
                        Expired
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{profile?.coins_balance?.toLocaleString() || 0}</div>
              <div className="text-sm text-muted-foreground">Erigga Coins</div>
            </div>
          </div>

          {(isExpiringSoon() || isExpired()) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg"
            >
              <div className="flex items-center gap-2 text-orange-800">
                <Clock className="h-4 w-4" />
                <span className="font-medium">
                  {isExpired() ? "Your membership has expired" : "Your membership expires soon"}
                </span>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                Renew now to continue enjoying premium benefits and exclusive content.
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="upgrade" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upgrade">Upgrade</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="upgrade" className="space-y-6">
          {/* Upgrade Options */}
          <Card>
            <CardHeader>
              <CardTitle>Upgrade Your Membership</CardTitle>
              <p className="text-muted-foreground">
                Get access to exclusive content, early releases, and VIP experiences
              </p>
            </CardHeader>
            <CardContent>
              <AnimatedTierCards
                onUpgrade={(tier) => {
                  // Handle upgrade logic here
                  window.location.href = `/premium?tier=${tier}`
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Membership History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getTierIcon(transaction.from_tier)}
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                          {getTierIcon(transaction.to_tier)}
                        </div>
                        <div>
                          <div className="font-medium">
                            Upgraded from {transaction.from_tier} to {transaction.to_tier}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(transaction.created_at)} • {transaction.duration_months} month(s)
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              transaction.status === "active"
                                ? "bg-green-100 text-green-800"
                                : transaction.status === "expired"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.amount_paid_naira
                            ? formatCurrency(transaction.amount_paid_naira)
                            : `${transaction.amount_paid_coins} coins`}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Transaction History</h3>
                  <p>You haven't made any membership purchases yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
