"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

interface WalletContextType {
  balance: number
  walletBalance: number
  isLoading: boolean
  error: string | null
  refreshBalance: () => Promise<void>
  refreshAfterPayment: (delay?: number) => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, profile } = useAuth()
  const [balance, setBalance] = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchBalance = useCallback(async () => {
    if (!isAuthenticated || !profile?.id) {
      setBalance(0)
      setWalletBalance(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/wallet/balance")
      if (!response.ok) {
        throw new Error("Failed to fetch balance")
      }

      const data = await response.json()
      if (data.success) {
        setBalance(data.balance || 0)
        setWalletBalance(data.walletBalance || 0)
      } else {
        throw new Error(data.error || "Failed to fetch balance")
      }
    } catch (err) {
      console.error("Error fetching balance:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch balance")
      setBalance(profile?.coins || 0)
      setWalletBalance(0)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, profile?.id, profile?.coins])

  const refreshBalance = useCallback(async () => {
    await fetchBalance()
  }, [fetchBalance])

  const refreshAfterPayment = useCallback(
    async (delay = 2000) => {
      await refreshBalance()

      setTimeout(async () => {
        await refreshBalance()
        setTimeout(refreshBalance, 3000)
      }, delay)
    },
    [refreshBalance],
  )

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  useEffect(() => {
    if (!isAuthenticated || !profile?.id) return

    const channel = supabase
      .channel(`wallet-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_wallets",
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          console.log("[v0] Wallet balance updated via real-time")
          refreshBalance()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wallet_transactions",
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          console.log("[v0] New wallet transaction detected")
          refreshBalance()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAuthenticated, profile?.id, refreshBalance, supabase])

  const value: WalletContextType = {
    balance,
    walletBalance,
    isLoading,
    error,
    refreshBalance,
    refreshAfterPayment,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
