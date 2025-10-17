"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Building2, CreditCard, CheckCircle, AlertCircle, Loader2, Trash2, Plus, Shield } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Bank {
  id: string
  bank_name: string
  bank_code: string
  bank_type: string
  is_active: boolean
}

interface BankAccount {
  id: string
  account_number: string
  account_name: string
  bank_code: string
  is_verified: boolean
  created_at: string
  nigerian_banks: {
    bank_name: string
    bank_type: string
  }
}

export function BankAccountManager() {
  const { toast } = useToast()
  const [banks, setBanks] = useState<Bank[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [selectedBank, setSelectedBank] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Fetch banks and accounts on component mount
  useEffect(() => {
    fetchBanks()
    fetchAccounts()
  }, [])

  const fetchBanks = async () => {
    try {
      const response = await fetch("/api/banks/list")
      const data = await response.json()

      if (data.success) {
        setBanks(data.banks)
      } else {
        setError("Failed to load banks")
      }
    } catch (error) {
      console.error("Error fetching banks:", error)
      setError("Failed to load banks")
    }
  }

  const fetchAccounts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/banks/accounts")
      const data = await response.json()

      if (data.success) {
        setAccounts(data.accounts)
      } else {
        setError("Failed to load bank accounts")
      }
    } catch (error) {
      console.error("Error fetching accounts:", error)
      setError("Failed to load bank accounts")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyAccount = async () => {
    if (!selectedBank || !accountNumber) {
      setError("Please select a bank and enter account number")
      return
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      setError("Account number must be exactly 10 digits")
      return
    }

    setIsVerifying(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/banks/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountNumber,
          bankCode: selectedBank,
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.alreadyExists) {
          setSuccess(data.message)
        } else {
          setSuccess(`Account verified successfully: ${data.account.account_name}`)
          setAccountNumber("")
          setSelectedBank("")
          setShowAddForm(false)
          await fetchAccounts() // Refresh accounts list
        }

        toast({
          title: "Success",
          description: data.alreadyExists ? data.message : "Bank account verified and added successfully",
        })
      } else {
        setError(data.error || "Verification failed")
        toast({
          title: "Verification Failed",
          description: data.error || "Unable to verify bank account",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Verification error:", error)
      setError("Network error occurred")
      toast({
        title: "Error",
        description: "Network error occurred during verification",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this bank account?")) {
      return
    }

    try {
      const response = await fetch("/api/banks/accounts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountId }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Bank account deleted successfully",
        })
        await fetchAccounts() // Refresh accounts list
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete bank account",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      })
    }
  }

  const getBankTypeColor = (bankType: string) => {
    switch (bankType) {
      case "traditional":
        return "bg-blue-100 text-blue-800"
      case "digital":
        return "bg-green-100 text-green-800"
      case "fintech":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bank Accounts</h2>
          <p className="text-muted-foreground">Manage your verified bank accounts for withdrawals</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Add Account Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Add Bank Account
            </CardTitle>
            <CardDescription>
              Verify your bank account to enable withdrawals. We use Paystack to securely verify your account details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank-select">Select Bank</Label>
                <Select value={selectedBank} onValueChange={setSelectedBank}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank.bank_code} value={bank.bank_code}>
                        <div className="flex items-center justify-between w-full">
                          <span>{bank.bank_name}</span>
                          <Badge className={getBankTypeColor(bank.bank_type)} variant="secondary">
                            {bank.bank_type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-number">Account Number</Label>
                <Input
                  id="account-number"
                  type="text"
                  placeholder="Enter 10-digit account number"
                  value={accountNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 10)
                    setAccountNumber(value)
                    setError(null)
                    setSuccess(null)
                  }}
                  maxLength={10}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleVerifyAccount}
                disabled={isVerifying || !selectedBank || !accountNumber}
                className="flex items-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Verify Account
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Accounts */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Bank Accounts</h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading accounts...</span>
          </div>
        ) : accounts.length > 0 ? (
          <div className="grid gap-4">
            {accounts.map((account) => (
              <Card key={account.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{account.nigerian_banks.bank_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {account.account_number} • {account.account_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getBankTypeColor(account.nigerian_banks.bank_type)} variant="secondary">
                            {account.nigerian_banks.bank_type}
                          </Badge>
                          {account.is_verified ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Unverified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Bank Accounts</h3>
              <p className="text-muted-foreground mb-4">Add and verify a bank account to enable withdrawals</p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Account
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
