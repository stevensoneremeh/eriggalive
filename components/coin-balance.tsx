"use client"

import { useAuth } from "@/contexts/auth-context"
import { Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react"
import { CoinPurchase } from "@/components/coin-purchase"
import { CoinWithdrawal } from "@/components/coin-withdrawal"

interface CoinBalanceProps {
  showActions?: boolean
  size?: "sm" | "md" | "lg"
}

export function CoinBalance({ showActions = true, size = "md" }: CoinBalanceProps) {
  const { profile } = useAuth()
  const [dialogContent, setDialogContent] = useState<"purchase" | "withdraw" | null>(null)

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg font-bold",
  }

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  return (
    <div className="flex items-center">
      <div className={`flex items-center gap-1.5 ${sizeClasses[size]}`}>
        <Coins className={`text-yellow-500 ${iconSizes[size]}`} />
        <span className="font-semibold">{profile?.coins || 0}</span>
        <span className="text-muted-foreground">Coins</span>
      </div>

      {showActions && (
        <div className="flex items-center ml-2 gap-2">
          <Dialog open={dialogContent !== null} onOpenChange={(open) => !open && setDialogContent(null)}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-green-500 text-green-500 hover:bg-green-500/10"
                onClick={() => setDialogContent("purchase")}
              >
                Buy
              </Button>
            </DialogTrigger>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-blue-500 text-blue-500 hover:bg-blue-500/10"
                onClick={() => setDialogContent("withdraw")}
              >
                Withdraw
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {dialogContent === "purchase" ? "Purchase Erigga Coins" : "Withdraw Erigga Coins"}
                </DialogTitle>
                <DialogDescription>
                  {dialogContent === "purchase"
                    ? "Buy Erigga Coins to access premium content and features."
                    : "Withdraw your Erigga Coins to your crypto wallet."}
                </DialogDescription>
              </DialogHeader>

              {dialogContent === "purchase" ? (
                <CoinPurchase onSuccess={() => setDialogContent(null)} />
              ) : (
                <CoinWithdrawal onSuccess={() => setDialogContent(null)} />
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}
