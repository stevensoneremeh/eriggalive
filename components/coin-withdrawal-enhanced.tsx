"use client"

import { useState, useCallback, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coins, Banknote, AlertCircle, CheckCircle, Loader2, Shield, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

interface CoinWithdrawalEnhancedProps {
  onSuccess?: (withdrawal: any) => void
  onError?: (error: string) => void
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

// Validation functions
const validateAccountNumber = (accountNumber: string): string | null => {
  if (!accountNumber) return "Account number is required"
  if (accountNumber.length !== 10) return "Account number must be exactly 10 digits"
  if (!/^\d+$/.test(accountNumber)) return "Account number must contain only digits"
  return null
}

const validateWithdrawalAmount = (amount: number, balance: number): string | null => {
  if (isNaN(amount) || amount <= 0) return "Please enter a valid amount"
<<<<<<< HEAD
  if (amount < 10000) return "Minimum withdrawal amount is 10,000 Erigga Coins"
=======
  if (amount < 100000) return "Minimum withdrawal amount is 100,000 Erigga Coins"
>>>>>>> new
  if (amount > balance) return "Insufficient balance"
  if (amount > 1000000) return "Maximum withdrawal is 1,000,000 coins per transaction"
  return null
}

export function CoinWithdrawalEnhanced({ onSuccess, onError }: CoinWithdrawalEnhancedProps) {
<<<<<<< HEAD
  const { profile, refreshSession } = useAuth()
=======
  const { profile, refreshSession, user } = useAuth()
>>>>>>> new
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [bankCode, setBankCode] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [withdrawalAttempts, setWithdrawalAttempts] = useState(0)
  const [lastVerificationTime, setLastVerificationTime] = useState<number>(0)

  const currentBalance = profile?.coins || 0
<<<<<<< HEAD
  const minWithdrawal = 10000
  const maxWithdrawal = 1000000
  const withdrawalAmount = Number.parseInt(amount, 10) || 0
  const nairaEquivalent = withdrawalAmount * 0.5
=======
  const minWithdrawal = 100000 // Updated minimum to 100,000 coins
  const maxWithdrawal = 1000000
  const withdrawalAmount = Number.parseInt(amount, 10) || 0
  const nairaEquivalent = withdrawalAmount * 0.1 // Updated exchange rate: 100,000 coins = ₦10,000
>>>>>>> new
  const processingFee = Math.max(25, nairaEquivalent * 0.01) // 1% fee, minimum ₦25

  const resetState = useCallback(() => {
    setError(null)
    setSuccess(null)
  }, [])

  // Reset account name when bank or account number changes
  useEffect(() => {
    if (accountName && (bankCode !== bankCode || accountNumber !== accountNumber)) {
      setAccountName("")
    }
  }, [bankCode, accountNumber])

  const verifyAccountNumber = useCallback(async () => {
    const accountValidation = validateAccountNumber(accountNumber)
    if (accountValidation) {
      setError(accountValidation)
      return
    }

    if (!bankCode) {
      setError("Please select a bank first")
      return
    }

    // Rate limiting: prevent too frequent verification attempts
    const now = Date.now()
    if (now - lastVerificationTime < 3000) {
      setError("Please wait a moment before verifying again")
      return
    }

    setIsVerifying(true)
    setError(null)
    setLastVerificationTime(now)

    try {
<<<<<<< HEAD
      // Simulate API delay for account verification
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock account verification (in production, use Paystack's account verification API)
      const mockAccountNames = ["John Doe", "Jane Smith", "Ahmed Ibrahim", "Chioma Okafor", "Emeka Nwankwo"]

      const randomName = mockAccountNames[Math.floor(Math.random() * mockAccountNames.length)]
      const mockAccountName = `${randomName} (Erigga Fan)`

      // Simulate occasional verification failures
      if (Math.random() < 0.1) {
        throw new Error("Account verification failed. Please check your account number.")
      }

      setAccountName(mockAccountName)

      toast({
        title: "Account Verified",
        description: `Account holder: ${mockAccountName}`,
=======
      const response = await fetch(`/api/coins/withdraw?account_number=${accountNumber}&bank_code=${bankCode}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Bank account verification failed")
      }

      setAccountName(result.account_name)

      toast({
        title: "Account Verified",
        description: `Account holder: ${result.account_name}`,
>>>>>>> new
        duration: 3000,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to verify account number"
      setError(errorMessage)

      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsVerifying(false)
    }
  }, [bankCode, accountNumber, lastVerificationTime, toast])

  const validateWithdrawal = useCallback(() => {
    resetState()

<<<<<<< HEAD
    if (!profile?.id) {
=======
    if (!user?.id) {
>>>>>>> new
      setError("Please log in to withdraw coins")
      return false
    }

    const amountValidation = validateWithdrawalAmount(withdrawalAmount, currentBalance)
    if (amountValidation) {
      setError(amountValidation)
      return false
    }

    if (!bankCode) {
      setError("Please select a bank")
      return false
    }

    const accountValidation = validateAccountNumber(accountNumber)
    if (accountValidation) {
      setError(accountValidation)
      return false
    }

    if (!accountName) {
      setError("Please verify your account number first")
      return false
    }

    if (withdrawalAttempts >= 3) {
      setError("Too many withdrawal attempts. Please wait 10 minutes before trying again.")
      return false
    }

    return true
<<<<<<< HEAD
  }, [profile, withdrawalAmount, currentBalance, bankCode, accountNumber, accountName, withdrawalAttempts])
=======
  }, [user, withdrawalAmount, currentBalance, bankCode, accountNumber, accountName, withdrawalAttempts])
>>>>>>> new

  const handleWithdraw = useCallback(async () => {
    if (!validateWithdrawal()) return

    setIsProcessing(true)
    setWithdrawalAttempts((prev) => prev + 1)

    try {
      const selectedBank = NIGERIAN_BANKS.find((bank) => bank.code === bankCode)

      const bankDetails = {
        bankCode,
        bankName: selectedBank?.name,
        accountNumber,
        accountName,
<<<<<<< HEAD
        recipientCode: `RCP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
=======
>>>>>>> new
      }

      const withdrawalData = {
        amount: withdrawalAmount,
        nairaAmount: nairaEquivalent,
        processingFee,
        bankDetails,
        userId: profile?.id,
        timestamp: new Date().toISOString(),
      }

      const response = await fetch("/api/coins/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
<<<<<<< HEAD
          Authorization: `Bearer ${localStorage.getItem("auth_token") || "mock-token"}`,
=======
>>>>>>> new
        },
        body: JSON.stringify(withdrawalData),
      })

<<<<<<< HEAD
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Withdrawal request failed")
=======
      const result = await response.json()

      if (!response.ok || !result.success) {
        let errorMessage = result.error || "Withdrawal request failed"

        switch (result.code) {
          case "AUTH_ERROR":
            errorMessage = "Please log in to complete your withdrawal"
            break
          case "VALIDATION_ERROR":
            errorMessage = `Validation failed: ${result.error}`
            break
          case "PENDING_WITHDRAWAL_EXISTS":
            errorMessage = "You already have a pending withdrawal request"
            break
          case "BANK_VERIFICATION_FAILED":
            errorMessage = "Bank account verification failed. Please check your details."
            break
          case "INSUFFICIENT_BALANCE":
            errorMessage = "Insufficient coin balance for this withdrawal"
            break
          default:
            errorMessage = result.error || `Withdrawal failed (${response.status})`
        }

        throw new Error(errorMessage)
>>>>>>> new
      }

      setSuccess(result.message || "Withdrawal request submitted successfully!")

      toast({
        title: "Withdrawal Submitted",
        description: `${withdrawalAmount.toLocaleString()} coins withdrawal request submitted. Processing time: 1-3 business days.`,
        duration: 5000,
      })

      // Refresh user session to update coin balance
<<<<<<< HEAD
      await refreshSession()
=======
      if (refreshSession) {
        await refreshSession()
      }
>>>>>>> new

      if (onSuccess) onSuccess(result.withdrawal)

      // Reset form
      setAmount("")
      setAccountNumber("")
      setAccountName("")
      setBankCode("")
      setWithdrawalAttempts(0)
    } catch (err) {
      console.error("Error processing withdrawal:", err)
      const errorMessage = err instanceof Error ? err.message : "An error occurred while processing your withdrawal"
      setError(errorMessage)

      toast({
        title: "Withdrawal Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })

      if (onError) onError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }, [
    validateWithdrawal,
    withdrawalAmount,
    nairaEquivalent,
    processingFee,
    bankCode,
    accountNumber,
    accountName,
    profile,
    refreshSession,
    onSuccess,
    onError,
    toast,
  ])

  const isFormValid =
    withdrawalAmount >= minWithdrawal &&
    withdrawalAmount <= currentBalance &&
    bankCode &&
    accountNumber.length === 10 &&
    accountName &&
    !isProcessing &&
    !isVerifying

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Withdraw Erigga Coins</h2>
        <p className="text-muted-foreground">Convert your coins back to Naira</p>
        <div className="flex items-center justify-center mt-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 mr-1" />
          Secure withdrawal via bank transfer
        </div>
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
          <CardDescription>
            Minimum withdrawal: {minWithdrawal.toLocaleString()} coins • Maximum: {maxWithdrawal.toLocaleString()} coins
          </CardDescription>
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
            max={Math.min(currentBalance, maxWithdrawal)}
            placeholder={`Enter amount (${minWithdrawal.toLocaleString()} - ${Math.min(currentBalance, maxWithdrawal).toLocaleString()})`}
            value={amount}
            onChange={(e) => {
              const value = e.target.value
              if (value === "" || (Number.parseInt(value, 10) >= 0 && Number.parseInt(value, 10) <= maxWithdrawal)) {
                setAmount(value)
                resetState()
              }
            }}
            className={error && amount ? "border-red-500" : ""}
          />
          {withdrawalAmount >= minWithdrawal && withdrawalAmount <= currentBalance && (
            <div className="p-3 bg-muted rounded-md space-y-2">
              <div className="flex justify-between items-center">
                <span className="flex items-center text-green-600">
                  <Banknote className="h-4 w-4 mr-1" />
                  You will receive:
                </span>
                <span className="font-bold text-green-600">₦{(nairaEquivalent - processingFee).toLocaleString()}</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Gross amount:</span>
                  <span>₦{nairaEquivalent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing fee:</span>
                  <span>₦{processingFee.toLocaleString()}</span>
                </div>
                <hr className="my-1" />
                <div className="flex justify-between font-medium">
                  <span>Net amount:</span>
                  <span>₦{(nairaEquivalent - processingFee).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank-select">Select Bank</Label>
          <Select
            value={bankCode}
            onValueChange={(value) => {
              setBankCode(value)
              setAccountName("")
              resetState()
            }}
          >
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
                const value = e.target.value.replace(/\D/g, "")
                setAccountNumber(value)
                setAccountName("")
                resetState()
              }}
              className={error && accountNumber ? "border-red-500" : ""}
            />
            <Button
              type="button"
              variant="outline"
              onClick={verifyAccountNumber}
              disabled={!bankCode || accountNumber.length !== 10 || isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Enter exactly 10 digits</span>
            <span>{accountNumber.length}/10</span>
          </div>
          {accountName && (
            <div className="flex items-center text-sm text-green-600 font-medium">
              <CheckCircle className="h-4 w-4 mr-1" />
              Account Name: {accountName}
            </div>
          )}
        </div>

        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p>
                <strong>Processing Time:</strong> 1-3 business days
              </p>
              <p>
                <strong>Processing Fee:</strong> 1% (minimum ₦25)
              </p>
              <p>
                <strong>Business Hours:</strong> Monday - Friday, 9 AM - 5 PM
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
          onClick={handleWithdraw}
          disabled={!isFormValid}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing Withdrawal...
            </>
          ) : (
            <>
              <Banknote className="h-4 w-4 mr-2" />
              Withdraw {withdrawalAmount.toLocaleString()} Coins
            </>
          )}
        </Button>
      </div>

      {withdrawalAttempts > 0 && (
        <div className="text-xs text-muted-foreground text-center">Withdrawal attempts: {withdrawalAttempts}/3</div>
      )}

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>Withdrawals are processed securely through our banking partners.</p>
        <p>You will receive SMS and email notifications for status updates.</p>
        <p>Contact support if you don't receive your funds within 3 business days.</p>
      </div>
    </div>
  )
}
