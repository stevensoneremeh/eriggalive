"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coins, Banknote, AlertCircle, CheckCircle, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CoinWithdrawalEnhancedProps {
  onSuccess?: () => void
}

const NIGERIAN_BANKS = [
  { code: "044", name: "Access Bank" },
  { code: "014", name: "Afribank" },
  { code: "023", name: "Citibank" },
  { code: "050", name: "Ecobank" },
  { code: "011", name: "First Bank" },
  { code: "214", name: "First City Monument Bank" },
  { code: "070", name: "Fidelity Bank" },
  { code: "058", name: "Guaranty Trust Bank" },
  { code: "030", name: "Heritage Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "076", name: "Polaris Bank" },
  { code: "221", name: "Stanbic IBTC Bank" },
  { code: "068", name: "Standard Chartered" },
  { code: "232", name: "Sterling Bank" },
  { code: "032", name: "Union Bank" },
  { code: "033", name: "United Bank for Africa" },
  { code: "215", name: "Unity Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "057", name: "Zenith Bank" },
]

export function CoinWithdrawalEnhanced({ onSuccess }: CoinWithdrawalEnhancedProps) {
  const { profile } = useAuth()
  const [amount, setAmount] = useState("")
  const [bankCode, setBankCode] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const currentBalance = profile?.coins || 0
  const minWithdrawal = 10000
  const withdrawalAmount = Number.parseInt(amount, 10) || 0
  const nairaEquivalent = withdrawalAmount * 0.5

  const verifyAccountNumber = async () => {
    if (!bankCode || !accountNumber || accountNumber.length !== 10) {
      setError("Please select a bank and enter a valid 10-digit account number")
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      // Mock account verification (in production, use Paystack's account verification API)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock response
      const mockAccountName = "John Doe Erigga Fan"
      setAccountName(mockAccountName)
    } catch (err) {
      setError("Failed to verify account number")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleWithdraw = async () => {
    setError(null)
    setSuccess(null)
    setIsProcessing(true)

    try {
      if (withdrawalAmount < minWithdrawal) {
        setError(`Minimum withdrawal amount is ${minWithdrawal.toLocaleString()} Erigga Coins`)
        setIsProcessing(false)
        return
      }

      if (withdrawalAmount > currentBalance) {
        setError("Insufficient balance")
        setIsProcessing(false)
        return
      }

      if (!accountName) {
        setError("Please verify your account number first")
        setIsProcessing(false)
        return
      }

      const bankDetails = {
        bankCode,
        bankName: NIGERIAN_BANKS.find((bank) => bank.code === bankCode)?.name,
        accountNumber,
        accountName,
        recipientCode: `RCP_${Date.now()}`, // In production, create recipient via Paystack API
      }

      const response = await fetch("/api/coins/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer mock-token`, // In production, use real JWT
        },
        body: JSON.stringify({
          amount: withdrawalAmount,
          bankDetails,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(result.message)
        setAmount("")
        setAccountNumber("")
        setAccountName("")
        setBankCode("")
        if (onSuccess) onSuccess()
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error("Error processing withdrawal:", err)
      setError("An error occurred while processing your withdrawal")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Withdraw Erigga Coins</h2>
        <p className="text-muted-foreground">Convert your coins back to Naira</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Coins className="h-5 w-5 text-yellow-500 mr-2" />
              Available Balance
            </div>
            <span className="text-2xl font-bold">{currentBalance.toLocaleString()}</span>
          </CardTitle>
          <CardDescription>Minimum withdrawal: {minWithdrawal.toLocaleString()} coins</CardDescription>
        </CardHeader>
      </Card>

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="withdrawal-amount">Withdrawal Amount (Coins)</Label>
          <Input
            id="withdrawal-amount"
            type="number"
            min={minWithdrawal}
            max={currentBalance}
            placeholder={`Enter amount (min. ${minWithdrawal.toLocaleString()})`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {withdrawalAmount >= minWithdrawal && (
            <div className="flex items-center text-sm text-green-600">
              <Banknote className="h-4 w-4 mr-1" />
              You will receive: ₦{nairaEquivalent.toLocaleString()}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank-select">Select Bank</Label>
          <Select value={bankCode} onValueChange={setBankCode}>
            <SelectTrigger>
              <SelectValue placeholder="Choose your bank" />
            </SelectTrigger>
            <SelectContent>
              {NIGERIAN_BANKS.map((bank) => (
                <SelectItem key={bank.code} value={bank.code}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-number">Account Number</Label>
          <div className="flex gap-2">
            <Input
              id="account-number"
              type="text"
              maxLength={10}
              placeholder="Enter 10-digit account number"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value.replace(/\D/g, ""))
                setAccountName("")
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={verifyAccountNumber}
              disabled={!bankCode || accountNumber.length !== 10 || isVerifying}
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </Button>
          </div>
          {accountName && <div className="text-sm text-green-600 font-medium">Account Name: {accountName}</div>}
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Withdrawals are processed within 1-3 business days. A small processing fee may apply.
          </AlertDescription>
        </Alert>

        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          onClick={handleWithdraw}
          disabled={
            isProcessing ||
            withdrawalAmount < minWithdrawal ||
            withdrawalAmount > currentBalance ||
            !accountName ||
            !bankCode ||
            accountNumber.length !== 10
          }
        >
          {isProcessing ? "Processing Withdrawal..." : `Withdraw ${withdrawalAmount.toLocaleString()} Coins`}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Withdrawals are processed securely through Paystack. Processing time: 1-3 business days.
      </div>
    </div>
  )
}
