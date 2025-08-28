"use client"
import { useState, useEffect, useCallback } from "react"
import useSWR from "swr"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"

const FEATURE_UI_FIXES_V1 = process.env.NEXT_PUBLIC_FEATURE_UI_FIXES_V1 === "true"

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Failed to fetch balance")
  }
  return response.json()
}

export function useUserBalance() {
  const { isAuthenticated, profile } = useAuth()
  const [realtimeBalance, setRealtimeBalance] = useState<number | null>(null)
  const supabase = createClient()

  const { data, mutate, error, isLoading } = useSWR(isAuthenticated ? "/api/me/balance" : null, fetcher, {
    refreshInterval: FEATURE_UI_FIXES_V1 ? 15000 : 30000, // Faster refresh when feature flag enabled
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 3000, // Reduced deduping interval for more responsive updates
    errorRetryCount: 3,
    errorRetryInterval: 2000,
  })

  useEffect(() => {
    if (!FEATURE_UI_FIXES_V1 || !isAuthenticated || !profile?.id) return

    const channel = supabase
      .channel(`wallet-balance-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_wallets",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log("[v0] Wallet balance updated via realtime:", payload)
          if (payload.new && typeof payload.new.coin_balance === "number") {
            setRealtimeBalance(payload.new.coin_balance)
            // Trigger SWR revalidation after a short delay
            setTimeout(() => mutate(), 500)
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          console.log("[v0] User coins updated via realtime:", payload)
          if (payload.new && typeof payload.new.coins === "number") {
            setRealtimeBalance(payload.new.coins)
            setTimeout(() => mutate(), 500)
          }
        },
      )
      .subscribe()

    return () => {
      console.log("[v0] Unsubscribing from wallet balance realtime")
      supabase.removeChannel(channel)
    }
  }, [isAuthenticated, profile?.id, supabase, mutate])

  const refreshBalance = useCallback(async () => {
    try {
      console.log("[v0] Manually refreshing balance")
      await mutate()
      setRealtimeBalance(null) // Clear realtime override after manual refresh
    } catch (error) {
      console.error("Failed to refresh balance:", error)
    }
  }, [mutate])

  const refreshAfterPayment = useCallback(
    async (delay = 1000) => {
      console.log("[v0] Refreshing balance after payment")
      setTimeout(async () => {
        await refreshBalance()
        setTimeout(refreshBalance, FEATURE_UI_FIXES_V1 ? 2000 : 3000)
      }, delay)
    },
    [refreshBalance],
  )

  const currentBalance = realtimeBalance !== null ? realtimeBalance : (data?.balance ?? profile?.coins ?? 0)

  return {
    balance: currentBalance,
    walletBalance: data?.walletBalance ?? 0,
    refresh: refreshBalance,
    refreshAfterPayment,
    isLoading,
    error,
    isAuthenticated,
    formattedBalance: currentBalance.toLocaleString(),
    isRealtime: FEATURE_UI_FIXES_V1 && realtimeBalance !== null,
  }
}

export function useRealtimeBalance() {
  const { profile } = useAuth()
  const { balance, refresh, isRealtime, formattedBalance } = useUserBalance()

  return {
    balance,
    refresh,
    isRealtime,
    formattedBalance,
  }
}
