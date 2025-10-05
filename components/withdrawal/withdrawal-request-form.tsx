"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Building2, Coins, AlertCircle, CheckCircle, Loader2, ArrowRight, Info, Calculator, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface BankAccount {
  id: string
  account_number: string
  account_name: string
  bank_code: string
  is_verified: boolean
  nigerian_banks: {
    bank_name: string
    bank_type: string
  }
}

interface WithdrawalRequestFormProps {
  onSuccess?: (withdrawal: any) => void
  onError?: (error: string) => void
}

export function WithdrawalRequestForm({ onSuccess, onError }: WithdrawalRequestFormProps) {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [selectedBankAccount, setSelectedBankAccount] = useState("")
  const [amountCoins, setAmountCoins] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch bank accounts on component mount
  useEffect(() => {
    fetchBankAccounts()
  }, [])

  const fetchBankAccounts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/banks/accounts")
      const data = await response.json()

      if (data.success) {
        const verifiedAccounts = data.accounts.filter((account: BankAccount) => account.is_verified)
        setBankAccounts(verifiedAccounts)
      } else {
        setError("Failed to load bank accounts")
      }
    } catch (error) {
      console.error("Error fetching bank accounts:", error)
      setError("Failed to load bank accounts")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateNairaAmount = (coins: number) => coins * 0.5
  const calculateProcessingFee = (nairaAmount: number) => Math.max(nairaAmount * 0.01, 25) // 1% minimum ₦25
  const calculateNetAmount = (nairaAmount: number) => nairaAmount - calculateProcessingFee(nairaAmount)

  const handleSubmit = async () => {
    setError(null)
    setSuccess(null)

    // Validation
    if (!selectedBankAccount) {
      setError("Please select a bank account")
      return
    }

    if (!amountCoins || isNaN(Number(amountCoins))) {
      setError("Please enter a valid amount")
      return
    }

    const coins = Number(amountCoins)
    if (coins < 100000) {
      setError("Minimum withdrawal amount is 100,000 coins")
      return
    }

    if (coins > (profile?.coins || 0)) {
      setError("Insufficient coin balance")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/withdrawals/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bankAccountId: selectedBankAccount,
          amountCoins: coins,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message)
        setAmountCoins("")
        setSelectedBankAccount("")

        toast({
          title: "Withdrawal Request Submitted",
          description: `Your withdrawal request for ${coins.toLocaleString()} coins has been submitted for review.`,
        })

        if (onSuccess) {
          onSuccess(data.withdrawal)
        }
      } else {
        setError(data.error || "Failed to submit withdrawal request")
        toast({
          title: "Withdrawal Failed",
          description: data.error || "Failed to submit withdrawal request",
          variant: "destructive",
        })

        if (onError) {
          onError(data.error || "Failed to submit withdrawal request")
        }
      }
    } catch (error) {
      console.error("Withdrawal submission error:", error)
      const errorMessage = "Network error occurred"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })

      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedAccount = bankAccounts.find((account) => account.id === selectedBankAccount)
  const coinsAmount = Number(amountCoins) || 0
  const nairaAmount = calculateNairaAmount(coinsAmount)
  const processingFee = calculateProcessingFee(nairaAmount)
  const netAmount = calculateNetAmount(nairaAmount)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading bank accounts...</span>
      </div>
    )
  }

  if (bankAccounts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Verified Bank Accounts</h3>
          <p className="text-muted-foreground mb-4">
            You need to add and verify a bank account before you can request withdrawals
          </p>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            Request Withdrawal
          </CardTitle>
          <CardDescription>
            Convert your Erigga Coins to Naira and withdraw to your verified bank account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

          {/* Current Balance */}
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-800">Available Balance</span>
              <span className="text-lg font-bold text-yellow-700">{(profile?.coins || 0).toLocaleString()} coins</span>
            </div>
            <p className="text-xs text-yellow-600 mt-1">≈ ₦{((profile?.coins || 0) * 0.5).toLocaleString()}</p>
          </div>

          {/* Bank Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="bank-account">Select Bank Account</Label>
            <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Choose your verified bank account" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">{account.nigerian_banks.bank_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {account.account_number} • {account.account_name}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount (Coins)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount (minimum 100,000 coins)"
              value={amountCoins}
              onChange={(e) => {
                setAmountCoins(e.target.value)
                setError(null)
                setSuccess(null)
              }}
              min="100000"
              max={profile?.coins || 0}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Minimum: 100,000 coins</span>
              <span>Maximum: {(profile?.coins || 0).toLocaleString()} coins</span>
            </div>
          </div>

          {/* Calculation Summary */}
          {coinsAmount >= 100000 && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calculator className="h-4 w-4" />
                Withdrawal Summary
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Coins to withdraw:</span>
                  <span className="font-medium">{coinsAmount.toLocaleString()} coins</span>
                </div>
                <div className="flex justify-between">
                  <span>Exchange rate:</span>
                  <span>1 coin = ₦0.50</span>
                </div>
                <div className="flex justify-between">
                  <span>Gross amount:</span>
                  <span className="font-medium">₦{nairaAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Processing fee (1%):</span>
                  <span>-₦{processingFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-green-600">
                  <span>Net amount:</span>
                  <span>₦{netAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Selected Bank Account Details */}
          {selectedAccount && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-2">
                <Building2 className="h-4 w-4" />
                Withdrawal Destination
              </div>
              <div className="text-sm">
                <div className="font-medium">{selectedAccount.nigerian_banks.bank_name}</div>
                <div className="text-blue-700">
                  {selectedAccount.account_number} • {selectedAccount.account_name}
                </div>
                <Badge className="mt-1 bg-blue-100 text-blue-800">{selectedAccount.nigerian_banks.bank_type}</Badge>
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedBankAccount || !amountCoins || coinsAmount < 100000}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                Submit Withdrawal Request
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>

          {/* Information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Processing time: 1-3 business days
                </p>
                <p>• Withdrawals are processed manually by our team</p>
                <p>• You will receive email notifications about status updates</p>
                <p>• Processing fee: 1% (minimum ₦25)</p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
