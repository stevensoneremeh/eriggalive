"use client"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Search, Download, TrendingUp, DollarSign, RefreshCw, Calendar } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Transaction {
  id: string
  reference: string
  amount: number
  status: string
  created_at: string
  raw: any
}

export default function TransactionsPage() {
  const supabase = createClientComponentClient()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) {
        console.error("Error loading transactions:", error)
        toast.error("Failed to load transactions")
        return
      }

      setTransactions(data || [])
    } catch (error) {
      console.error("Error loading transactions:", error)
      toast.error("Failed to load transactions")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const formatAmount = (amount: number) => {
    return `₦${(amount / 100).toLocaleString()}`
  }

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = selectedStatus === "all" || tx.status === selectedStatus

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: transactions.length,
    successful: transactions.filter((tx) => tx.status === "success").length,
    failed: transactions.filter((tx) => tx.status === "failed").length,
    pending: transactions.filter((tx) => tx.status === "pending").length,
    totalAmount: transactions.filter((tx) => tx.status === "success").reduce((acc, tx) => acc + tx.amount, 0),
  }

  useEffect(() => {
    loadTransactions()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Transaction Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor and manage payment transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadTransactions} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Successful</p>
                <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatAmount(stats.totalAmount)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>d>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                <p className="text-2xl font-bold">
                  {
                    transactions.filter(
                      (tx) => new Date(tx.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    ).length
                  }
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by reference or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedStatus === "all" ? "default" : "outline"}
            onClick={() => setSelectedStatus("all")}
            size="sm"
          >
            All ({stats.total})
          </Button>
          <Button
            variant={selectedStatus === "success" ? "default" : "outline"}
            onClick={() => setSelectedStatus("success")}
            size="sm"
          >
            Success ({stats.successful})
          </Button>
          <Button
            variant={selectedStatus === "failed" ? "default" : "outline"}
            onClick={() => setSelectedStatus("failed")}
            size="sm"
          >
            Failed ({stats.failed})
          </Button>
          <Button
            variant={selectedStatus === "pending" ? "default" : "outline"}
            onClick={() => setSelectedStatus("pending")}
            size="sm"
          >
            Pending ({stats.pending})
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
          <CardDescription>Recent payment transactions and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>

                    <div>
                      <p className="font-semibold">{transaction.reference}</p>
                      <p className="text-sm text-gray-500">ID: {transaction.id}</p>
                      <p className="text-xs text-gray-400">{new Date(transaction.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-lg">{formatAmount(transaction.amount)}</p>
                    <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
