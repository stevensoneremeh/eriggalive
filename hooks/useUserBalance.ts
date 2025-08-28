"use client"
import useSWR from "swr"
import { useAuth } from "@/contexts/auth-context"

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Failed to fetch balance")
  }
  return response.json()
}

export function useUserBalance() {
  const { isAuthenticated, profile } = useAuth()

  const { data, mutate, error, isLoading } = useSWR(isAuthenticated ? "/api/me/balance" : null, fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true, // Refresh when window gains focus
    revalidateOnReconnect: true, // Refresh when connection is restored
    dedupingInterval: 5000, // Prevent duplicate requests within 5 seconds
  })

  const refreshBalance = async () => {
    try {
      await mutate()
      console.log("Balance refreshed successfully")
    } catch (error) {
      console.error("Failed to refresh balance:", error)
    }
  }

  const refreshAfterPayment = async (delay = 2000) => {
    setTimeout(async () => {
      await refreshBalance()
      // Refresh again after another delay to ensure webhook processing is complete
      setTimeout(refreshBalance, 3000)
    }, delay)
  }

  return {
    balance: data?.balance ?? profile?.coins ?? 0,
    walletBalance: data?.walletBalance ?? 0,
    refresh: refreshBalance,
    refreshAfterPayment,
    isLoading,
    error,
    isAuthenticated,
  }
}

export function useRealtimeBalance() {
  const { profile } = useAuth()
  const { balance, refresh } = useUserBalance()

  // This would require Supabase real-time subscriptions to be enabled
  // useEffect(() => {
  //   if (!profile?.id) return
  //
  //   const subscription = supabase
  //     .channel('balance-changes')
  //     .on('postgres_changes', {
  //       event: 'UPDATE',
  //       schema: 'public',
  //       table: 'users',
  //       filter: `id=eq.${profile.id}`
  //     }, () => {
  //       refresh()
  //     })
  //     .subscribe()
  //
  //   return () => {
  //     subscription.unsubscribe()
  //   }
  // }, [profile?.id, refresh])

  return {
    balance,
    refresh,
  }
}
