"use client"
import useSWR from "swr"
import { useAuth } from "@/contexts/auth-context"
import type { MembershipTier, UserMembership } from "@/lib/membership"
import { isMembershipActive, getBadgeConfig, getDashboardTheme } from "@/lib/membership"

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Failed to fetch data")
  }
  return response.json()
}

export function useMembershipTiers() {
  const { data, error, isLoading } = useSWR<MembershipTier[]>("/api/membership/tiers", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // Cache for 5 minutes
  })

  return {
    tiers: data || [],
    isLoading,
    error,
  }
}

export function useUserMembership() {
  const { isAuthenticated, profile } = useAuth()

  const { data, mutate, error, isLoading } = useSWR(isAuthenticated ? "/api/membership/user" : null, fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 10000,
  })

  const membership = data?.membership as UserMembership | null
  const isActive = isMembershipActive(membership)
  const tierCode = membership?.tier_code || "FREE"
  const badgeConfig = getBadgeConfig(tierCode)
  const dashboardTheme = getDashboardTheme(tierCode)

  const refreshMembership = async () => {
    try {
      await mutate()
      console.log("Membership data refreshed successfully")
    } catch (error) {
      console.error("Failed to refresh membership:", error)
    }
  }

  const refreshAfterPurchase = async (delay = 3000) => {
    setTimeout(async () => {
      await refreshMembership()
      // Refresh again to ensure webhook processing is complete
      setTimeout(refreshMembership, 5000)
    }, delay)
  }

  return {
    membership,
    tierCode,
    isActive,
    badgeConfig,
    dashboardTheme,
    isLoading,
    error,
    refresh: refreshMembership,
    refreshAfterPurchase,
    isAuthenticated,
  }
}

export function useWallet() {
  const { isAuthenticated } = useAuth()

  const { data, mutate, error, isLoading } = useSWR(isAuthenticated ? "/api/wallet/balance" : null, fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
  })

  const refreshWallet = async () => {
    try {
      await mutate()
      console.log("Wallet data refreshed successfully")
    } catch (error) {
      console.error("Failed to refresh wallet:", error)
    }
  }

  const refreshAfterTransaction = async (delay = 2000) => {
    setTimeout(async () => {
      await refreshWallet()
      // Refresh again to ensure transaction processing is complete
      setTimeout(refreshWallet, 3000)
    }, delay)
  }

  return {
    balance: data?.balance_coins || 0,
    transactions: data?.recent_transactions || [],
    isLoading,
    error,
    refresh: refreshWallet,
    refreshAfterTransaction,
    isAuthenticated,
  }
}

// Combined hook for membership and wallet data
export function useMembershipData() {
  const membership = useUserMembership()
  const wallet = useWallet()
  const tiers = useMembershipTiers()

  return {
    membership,
    wallet,
    tiers,
    isLoading: membership.isLoading || wallet.isLoading || tiers.isLoading,
    refresh: async () => {
      await Promise.all([membership.refresh(), wallet.refresh()])
    },
  }
}
