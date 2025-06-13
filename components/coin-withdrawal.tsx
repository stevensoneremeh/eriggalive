"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Coins } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CoinWithdrawalProps {
  onSuccess?: () => void
}

export function CoinWithdrawal({ onSuccess }: CoinWithdrawalProps) {
  const { withdrawCoins, profile } = useAuth()
  const [amount, setAmount] = useState("")
  const [walletAddress, setWalletAddress] = useState(profile?.wallet_address || "")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleWithdraw = async () => {
    setError(null)
    setIsProcessing(true)

    try {
      const coinAmount = Number.parseInt(amount, 10)

      if (isNaN(coinAmount) || coinAmount <= 0) {
        setError("Please enter a valid amount")
        setIsProcessing(false)
        return
      }

      if (!walletAddress) {
        setError("Please enter a wallet address")
        setIsProcessing(false)
        return
      }

      if (!profile || profile.coins < coinAmount) {
        setError("Insufficient coins")
        setIsProcessing(false)
        return
      }

      const result = await withdrawCoins(coinAmount, walletAddress)

      if (result.error) {
        setError(result.error.message)
        return
      }

      if (onSuccess) onSuccess()
    } catch (err) {
      console.error("Error processing withdrawal:", err)
      setError("An error occurred while processing your withdrawal")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          <span className="font-medium">Available Balance</span>
        </div>
        <div className="font-bold">{profile?.coins || 0} Coins</div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="withdrawal-amount">Withdrawal Amount</Label>
          <Input
            id="withdrawal-amount"
            type="number"
            min="100"
            max={profile?.coins || 0}
            placeholder="Enter amount (min. 100 coins)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Minimum withdrawal: 100 coins</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wallet-address">Wallet Address</Label>
          <Input
            id="wallet-address"
            placeholder="Enter your crypto wallet address"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />
        </div>

        <Alert variant="warning">
          <AlertDescription>
            Withdrawals are processed within 24-48 hours. Please ensure you've entered the correct wallet address.
          </AlertDescription>
        </Alert>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 text-black"
          onClick={handleWithdraw}
          disabled={
            isProcessing ||
            !amount ||
            Number.parseInt(amount, 10) < 100 ||
            !walletAddress ||
            (profile && profile.coins < Number.parseInt(amount, 10))
          }
        >
          {isProcessing ? "Processing..." : "Withdraw Coins"}
        </Button>
      </div>
    </div>
  )
}
