"use client"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useUserBalance() {
  const { data, mutate, isLoading } = useSWR("/api/me/balance", fetcher, {
    refreshInterval: 0,
  })

  return {
    balance: data?.balance ?? 0,
    refresh: mutate,
    isLoading,
  }
}
