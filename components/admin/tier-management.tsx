"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"

interface PendingUpgrade {
  id: number
  user_id: number
  tier_name: string
  amount: number
  reference: string
  created_at: string
  user?: {
    username: string
    email: string
    current_tier: string
  }
}

interface TierStats {
  total_upgrades: number
  pending_approvals: number
  revenue_today: number
  revenue_month: number
  tier_distribution: Record<string, number>
}

export function TierManagement() {
  const { toast } = useToast()
  const [pendingUpgrades, setPendingUpgrades] = useState<PendingUpgrade[]>([])
  const [stats, setStats] = useState<TierStats | null>(null)
  const [settings, setSettings] = useState({
    manual_approval: false,
    auto_upgrade_delay_minutes: 0,
    max_upgrades_per_day: 50,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Mock data for demonstration
  useEffect(() => {
    const loadMockData = () => {
      // Mock pending upgrades
      setPendingUpgrades([
        {
          id: 1,
          user_id: 1,
          tier_name: "pioneer",
          amount: 2500,
          reference: "tier_upgrade_123",
          created_at: new Date().toISOString(),
          user: {
            username: "johndoe",
            email: "john@example.com",
            current_tier: "grassroot"
          }
        },
        {
          id: 2,
          user_id: 2,
          tier_name: "elder",
          amount: 5000,
          reference: "tier_upgrade_456",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          user: {
            username: "janedoe",
            email: "jane@example.com",
            current_tier: "pioneer"
          }
        }
      ])

      // Mock stats
      setStats({
        total_upgrades: 45,
        pending_approvals: 2,
        revenue_today: 25000,
        revenue_month: 450000,
        tier_distribution: {
          grassroot: 120,
          pioneer: 45,
          elder: 18,
          blood: 7
        }
      })

      setIsLoading(false)
    }

    loadMockData()
  }, [])

  const handleApproveUpgrade = async (upgradeId: number) => {
    try {
      // In a real app, this would call an API
      console.log(`Approving upgrade ${upgradeId}`)
      
      // Remove from pending list
      setPendingUpgrades(prev => prev.filter(u => u.id !== upgradeId))
      
      toast({
        title: "Upgrade Approved",
        description: "User tier has been upgraded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve upgrade",
        variant: "destructive",
      })
    }
  }

  const handleRejectUpgrade = async (upgradeId: number) => {
    try {
      // In a real app, this would call an API
      console.log(`Rejecting upgrade ${upgradeId}`)
      
      // Remove from pending list
      setPendingUpgrades(prev => prev.filter(u => u.id !== upgradeId))
      
      toast({
        title: "Upgrade Rejected",
        description: "User upgrade has been rejected and refunded",
      })
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to reject upgrade",
        variant: "destructive",
      })
    }
  }

  const handleSettingsUpdate = async () => {
    try {
      // In a real app, this would call an API
      console.log("Updating settings:", settings)
      
      toast({
        title: "Settings Updated",
        description: "Tier upgrade settings have been saved",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  return (
    <div className="space-y\
