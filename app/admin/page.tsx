"use client"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function AdminOverview() {
  const supabase = createClientComponentClient()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTransactions: 0,
    totalBalance: 0,
  })

  useEffect(() => {
    const loadStats = async () => {
      // Load basic stats
      const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })

      const { count: txCount } = await supabase.from("transactions").select("*", { count: "exact", head: true })

      const { data: walletData } = await supabase.from("wallet").select("balance")

      const totalBalance = walletData?.reduce((sum, w) => sum + (w.balance || 0), 0) || 0

      setStats({
        totalUsers: userCount || 0,
        totalTransactions: txCount || 0,
        totalBalance,
      })
    }

    loadStats()
  }, [supabase])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Total Transactions</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalTransactions}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Total Balance</h3>
          <p className="text-3xl font-bold text-purple-600">₦{(stats.totalBalance / 100).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
