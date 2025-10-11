"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Wallet, Search, Plus, Minus, History, TrendingUp, TrendingDown, Coins } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface WalletData {
  wallet: {
    coin_balance: number
    total_earned: number
    total_spent: number
    last_bonus_at?: string
  }
  transactions: Array<{
    id: string
    type: string
    amount: number
    description: string
    created_at: string
  }>
  user: {
    username: string
    email: string
    tier: string
    coins: number
  }
}

export default function WalletControlPage() {
  const [userId, setUserId] = useState("")
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(false)
  const [adjusting, setAdjusting] = useState(false)
  
  const [adjustmentForm, setAdjustmentForm] = useState({
    type: "credit",
    amount: "",
    description: "",
    reference: "",
  })

  const fetchWalletDetails = async () => {
    if (!userId.trim()) {
      toast.error("Please enter a user ID")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/wallet-management?userId=${userId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch wallet details")
      }

      setWalletData(data)
      toast.success("Wallet details loaded")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load wallet")
    } finally {
      setLoading(false)
    }
  }

  const handleAdjustment = async () => {
    if (!userId || !adjustmentForm.amount || !adjustmentForm.description) {
      toast.error("Please fill in all required fields")
      return
    }

    const amount = parseInt(adjustmentForm.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setAdjusting(true)
    try {
      const response = await fetch("/api/admin/wallet-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount,
          type: adjustmentForm.type,
          description: adjustmentForm.description,
          reference: adjustmentForm.reference || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to adjust wallet")
      }

      toast.success(data.message)
      
      // Reset form and refresh wallet data
      setAdjustmentForm({ type: "credit", amount: "", description: "", reference: "" })
      await fetchWalletDetails()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to adjust wallet")
    } finally {
      setAdjusting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatAmount = (amount: number) => {
    return amount.toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wallet Control Center</h1>
        <p className="text-muted-foreground">Manage user coin balances and view transaction history</p>
      </div>

      {/* User Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search User
          </CardTitle>
          <CardDescription>Enter user ID to view and manage their wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter user ID (UUID)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchWalletDetails()}
              />
            </div>
            <Button onClick={fetchWalletDetails} disabled={loading}>
              {loading ? "Loading..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Overview */}
      {walletData && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{walletData.user.username}</div>
                <p className="text-xs text-muted-foreground">{walletData.user.email}</p>
                <Badge className="mt-2">{walletData.user.tier}</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  <div className="text-2xl font-bold">{formatAmount(walletData.wallet.coin_balance)}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">coins available</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div className="text-2xl font-bold">{formatAmount(walletData.wallet.total_earned)}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">all time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <div className="text-2xl font-bold">{formatAmount(walletData.wallet.total_spent)}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">all time</p>
              </CardContent>
            </Card>
          </div>

          {/* Wallet Adjustment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Adjust Wallet Balance
              </CardTitle>
              <CardDescription>Credit or debit coins from user wallet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Transaction Type</Label>
                  <Select
                    value={adjustmentForm.type}
                    onValueChange={(value) => setAdjustmentForm({ ...adjustmentForm, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4 text-green-500" />
                          Credit (Add Coins)
                        </div>
                      </SelectItem>
                      <SelectItem value="debit">
                        <div className="flex items-center gap-2">
                          <Minus className="h-4 w-4 text-red-500" />
                          Debit (Remove Coins)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount (coins)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={adjustmentForm.amount}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description (Required)</Label>
                <Textarea
                  placeholder="Reason for adjustment (e.g., Refund for event cancellation, Bonus reward, etc.)"
                  value={adjustmentForm.description}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Reference (Optional)</Label>
                <Input
                  placeholder="Transaction reference or ID"
                  value={adjustmentForm.reference}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reference: e.target.value })}
                />
              </div>

              <Button
                onClick={handleAdjustment}
                disabled={adjusting || !adjustmentForm.amount || !adjustmentForm.description}
                className="w-full"
              >
                {adjusting ? "Processing..." : `${adjustmentForm.type === "credit" ? "Credit" : "Debit"} Wallet`}
              </Button>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>Recent wallet transactions for this user</CardDescription>
            </CardHeader>
            <CardContent>
              {walletData.transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {walletData.transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(tx.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={tx.amount >= 0 ? "default" : "destructive"}>
                            {tx.type.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{tx.description}</TableCell>
                        <TableCell className={`text-right font-mono ${tx.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {tx.amount >= 0 ? "+" : ""}{formatAmount(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
