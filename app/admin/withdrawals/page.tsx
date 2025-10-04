"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Banknote, Clock, CheckCircle, XCircle, Search, Filter, Eye, Shield, DollarSign } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface WithdrawalRequest {
  id: string
  user_id: string
  amount_coins: number
  amount_naira: number
  status: "pending" | "approved" | "rejected"
  created_at: string
  updated_at: string
  bank_accounts: {
    account_number: string
    bank_name: string
    account_name: string
  }
  users: {
    username: string
    email: string
    tier: string
  }
}

interface AdminStats {
  totalPendingWithdrawals: number
  totalApprovedWithdrawals: number
  totalRejectedWithdrawals: number
  totalWithdrawalAmount: number
  pendingAmount: number
}

export default function AdminWithdrawalsPage() {
  const { profile, user } = useAuth()
  const { toast } = useToast()
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null)
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  // Check admin access
  const hasAdminAccess = profile?.role === "admin"

  const fetchWithdrawals = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/withdrawals", {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch withdrawals")
      }

      const result = await response.json()
      if (result.success) {
        setWithdrawals(result.withdrawals)
        setStats(result.stats)
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error)
      toast({
        title: "Error",
        description: "Failed to fetch withdrawal requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawalAction = async (withdrawalId: string, action: "approve" | "reject", reason?: string) => {
    try {
      setProcessingAction(withdrawalId)

      const response = await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, reason }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} withdrawal`)
      }

      const result = await response.json()
      if (result.success) {
        toast({
          title: "Success",
          description: `Withdrawal ${action}d successfully`,
        })

        // Refresh data
        await fetchWithdrawals()
        setSelectedWithdrawal(null)
      }
    } catch (error) {
      console.error(`Error ${action}ing withdrawal:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} withdrawal`,
        variant: "destructive",
      })
    } finally {
      setProcessingAction(null)
    }
  }

  useEffect(() => {
    if (hasAdminAccess) {
      fetchWithdrawals()
    }
  }, [hasAdminAccess])

  const filteredWithdrawals = withdrawals.filter((withdrawal) => {
    const matchesSearch =
      withdrawal.users.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.users.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.bank_accounts.account_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || withdrawal.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => `₦${(amount / 100).toLocaleString()}`
  const formatCoins = (amount: number) => `${amount.toLocaleString()} coins`

  if (!hasAdminAccess) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>You need admin privileges to access this page.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Withdrawal Management</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Manage user withdrawal requests and monitor transactions
                </p>
              </div>
              <Badge className="mt-4 sm:mt-0 bg-orange-100 text-orange-800">
                <Shield className="w-4 h-4 mr-1" />
                Admin Dashboard
              </Badge>
            </div>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Requests</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.totalPendingWithdrawals}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{formatCurrency(stats.pendingAmount)} pending</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
                      <p className="text-2xl font-bold text-green-600">{stats.totalApprovedWithdrawals}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</p>
                      <p className="text-2xl font-bold text-red-600">{stats.totalRejectedWithdrawals}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalWithdrawalAmount)}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by username, email, or account name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawals Table */}
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Requests</CardTitle>
              <CardDescription>
                {filteredWithdrawals.length} of {withdrawals.length} requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Bank Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWithdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{withdrawal.users.username}</div>
                              <div className="text-sm text-gray-500">{withdrawal.users.email}</div>
                              <Badge variant="outline" className="text-xs mt-1">
                                {withdrawal.users.tier}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{formatCoins(withdrawal.amount_coins)}</div>
                              <div className="text-sm text-gray-500">{formatCurrency(withdrawal.amount_naira)}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{withdrawal.bank_accounts.account_name}</div>
                              <div className="text-sm text-gray-500">{withdrawal.bank_accounts.bank_name}</div>
                              <div className="text-xs text-gray-400">{withdrawal.bank_accounts.account_number}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                          <TableCell>
                            <div className="text-sm">{new Date(withdrawal.created_at).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(withdrawal.created_at).toLocaleTimeString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setSelectedWithdrawal(withdrawal)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl" aria-describedby="withdrawal-dialog-description">
                                  <DialogHeader>
                                    <DialogTitle>Withdrawal Request Details</DialogTitle>
                                    <DialogDescription id="withdrawal-dialog-description">Review and manage this withdrawal request</DialogDescription>
                                  </DialogHeader>
                                  {selectedWithdrawal && (
                                    <div className="space-y-6">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <h4 className="font-medium mb-2">User Information</h4>
                                          <div className="space-y-1 text-sm">
                                            <p>
                                              <strong>Username:</strong> {selectedWithdrawal.users.username}
                                            </p>
                                            <p>
                                              <strong>Email:</strong> {selectedWithdrawal.users.email}
                                            </p>
                                            <p>
                                              <strong>Tier:</strong> {selectedWithdrawal.users.tier}
                                            </p>
                                          </div>
                                        </div>
                                        <div>
                                          <h4 className="font-medium mb-2">Withdrawal Details</h4>
                                          <div className="space-y-1 text-sm">
                                            <p>
                                              <strong>Coins:</strong> {formatCoins(selectedWithdrawal.amount_coins)}
                                            </p>
                                            <p>
                                              <strong>Amount:</strong> {formatCurrency(selectedWithdrawal.amount_naira)}
                                            </p>
                                            <p>
                                              <strong>Status:</strong> {getStatusBadge(selectedWithdrawal.status)}
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      <div>
                                        <h4 className="font-medium mb-2">Bank Account Details</h4>
                                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <p>
                                              <strong>Account Name:</strong>{" "}
                                              {selectedWithdrawal.bank_accounts.account_name}
                                            </p>
                                            <p>
                                              <strong>Bank:</strong> {selectedWithdrawal.bank_accounts.bank_name}
                                            </p>
                                            <p>
                                              <strong>Account Number:</strong>{" "}
                                              {selectedWithdrawal.bank_accounts.account_number}
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      {selectedWithdrawal.status === "pending" && (
                                        <div className="flex gap-4 pt-4">
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button
                                                className="flex-1 bg-green-500 hover:bg-green-600"
                                                disabled={processingAction === selectedWithdrawal.id}
                                              >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Approve
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Approve Withdrawal</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Are you sure you want to approve this withdrawal request for{" "}
                                                  {formatCurrency(selectedWithdrawal.amount_naira)}? This action cannot
                                                  be undone.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={() =>
                                                    handleWithdrawalAction(selectedWithdrawal.id, "approve")
                                                  }
                                                  className="bg-green-500 hover:bg-green-600"
                                                >
                                                  Approve
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>

                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button
                                                variant="destructive"
                                                className="flex-1"
                                                disabled={processingAction === selectedWithdrawal.id}
                                              >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Reject
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Reject Withdrawal</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Are you sure you want to reject this withdrawal request? The user will
                                                  be notified of the rejection.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={() =>
                                                    handleWithdrawalAction(
                                                      selectedWithdrawal.id,
                                                      "reject",
                                                      "Admin review",
                                                    )
                                                  }
                                                  className="bg-red-500 hover:bg-red-600"
                                                >
                                                  Reject
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {filteredWithdrawals.length === 0 && (
                    <div className="text-center py-8">
                      <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No withdrawal requests found</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}