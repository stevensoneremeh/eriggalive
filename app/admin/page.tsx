"use client"

import { AdminGuard } from "@/components/admin-guard"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, CheckCircle, XCircle, RefreshCw, Shield, Activity, DollarSign, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import HealthDashboard from "@/components/health-dashboard"

interface AdminStats {
  users: {
    total: number
    new_today: number
    active_today: number
    by_tier: Record<string, number>
  }
  content: {
    albums: number
    tracks: number
    videos: number
    gallery: number
  }
  engagement: {
    total_plays: number
    total_likes: number
    total_votes: number
    total_comments: number
  }
  revenue: {
    total_coins_purchased: number
    total_revenue: number
    pending_withdrawals: number
  }
}

interface WithdrawalRequest {
  id: string
  user_id: string
  amount_coins: number
  amount_naira: number
  status: "pending" | "approved" | "rejected"
  created_at: string
  users: {
    username: string
    full_name: string
    email: string
  }
  bank_accounts: {
    account_name: string
    account_number: string
    bank_name: string
  }
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingWithdrawal, setProcessingWithdrawal] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${user?.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch admin stats:", error)
    }
  }

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch("/api/admin/withdrawals", {
        headers: {
          Authorization: `Bearer ${user?.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setWithdrawals(data.withdrawals || [])
      }
    } catch (error) {
      console.error("Failed to fetch withdrawals:", error)
    }
  }

  const handleWithdrawalAction = async (withdrawalId: string, action: "approve" | "reject", reason?: string) => {
    try {
      setProcessingWithdrawal(withdrawalId)

      const response = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({ withdrawalId, action, reason }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: result.message,
        })

        // Refresh data
        await Promise.all([fetchStats(), fetchWithdrawals()])
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process withdrawal",
        variant: "destructive",
      })
    } finally {
      setProcessingWithdrawal(null)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchStats(), fetchWithdrawals()])
      setLoading(false)
    }

    if (user) {
      loadData()
    }
  }, [user])

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`
  const formatCoins = (amount: number) => `${amount.toLocaleString()} coins`

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-2">
                  Admin Dashboard
                </h1>
                <p className="text-gray-300 text-lg">Manage your Erigga Live platform</p>
              </div>
              <div className="mt-4 sm:mt-0 flex gap-2">
                <Button
                  onClick={() => Promise.all([fetchStats(), fetchWithdrawals()])}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Badge className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white">
                  <Shield className="w-4 h-4 mr-2" />
                  ADMIN ACCESS
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Total Users</p>
                      <p className="text-3xl font-bold text-white">{stats.users.total}</p>
                      <p className="text-xs text-green-400">+{stats.users.new_today} today</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Total Revenue</p>
                      <p className="text-3xl font-bold text-white">{formatCurrency(stats.revenue.total_revenue)}</p>
                      <p className="text-xs text-gray-400">From coin purchases</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Pending Withdrawals</p>
                      <p className="text-3xl font-bold text-white">
                        {formatCurrency(stats.revenue.pending_withdrawals)}
                      </p>
                      <p className="text-xs text-orange-400">
                        {withdrawals.filter((w) => w.status === "pending").length} requests
                      </p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                      <Clock className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Active Users</p>
                      <p className="text-3xl font-bold text-white">{stats.users.active_today}</p>
                      <p className="text-xs text-blue-400">Today</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                      <Activity className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <Tabs defaultValue="withdrawals" className="space-y-6">
            <TabsList className="bg-white/10 border-white/20">
              <TabsTrigger value="withdrawals" className="data-[state=active]:bg-white/20">
                Withdrawal Requests
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-white/20">
                User Management
              </TabsTrigger>
              <TabsTrigger value="health" className="data-[state=active]:bg-white/20">
                System Health
              </TabsTrigger>
            </TabsList>

            <TabsContent value="withdrawals" className="space-y-6">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Withdrawal Requests</CardTitle>
                  <CardDescription className="text-gray-300">
                    Review and approve user withdrawal requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {withdrawals.length === 0 ? (
                      <p className="text-center text-gray-400 py-8">No withdrawal requests found</p>
                    ) : (
                      withdrawals.map((withdrawal) => (
                        <div key={withdrawal.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">
                                  {withdrawal.users.full_name || withdrawal.users.username}
                                </span>
                                <Badge
                                  variant={
                                    withdrawal.status === "pending"
                                      ? "secondary"
                                      : withdrawal.status === "approved"
                                        ? "default"
                                        : "destructive"
                                  }
                                >
                                  {withdrawal.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-300">
                                <p>
                                  Amount: {formatCoins(withdrawal.amount_coins)} →{" "}
                                  {formatCurrency(withdrawal.amount_naira / 100)}
                                </p>
                                <p>
                                  Bank: {withdrawal.bank_accounts.bank_name} - {withdrawal.bank_accounts.account_number}
                                </p>
                                <p>Account: {withdrawal.bank_accounts.account_name}</p>
                                <p>Requested: {new Date(withdrawal.created_at).toLocaleString()}</p>
                              </div>
                            </div>

                            {withdrawal.status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleWithdrawalAction(withdrawal.id, "approve")}
                                  disabled={processingWithdrawal === withdrawal.id}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {processingWithdrawal === withdrawal.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleWithdrawalAction(withdrawal.id, "reject", "Rejected by admin")}
                                  disabled={processingWithdrawal === withdrawal.id}
                                >
                                  <XCircle className="h-4 w-4" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">User Management</CardTitle>
                  <CardDescription className="text-gray-300">Manage user accounts and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-gray-400 py-8">User management features coming soon...</div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="health" className="space-y-6">
              <HealthDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminGuard>
  )
}
