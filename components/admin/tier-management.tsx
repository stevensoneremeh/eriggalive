"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Settings, CheckCircle, XCircle } from "lucide-react"

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
            current_tier: "grassroot",
          },
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
            current_tier: "pioneer",
          },
        },
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
          blood: 7,
        },
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
      setPendingUpgrades((prev) => prev.filter((u) => u.id !== upgradeId))

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
      setPendingUpgrades((prev) => prev.filter((u) => u.id !== upgradeId))

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
    <div className="space-y-4">
      {/* Pending Upgrades Section */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Upgrades</CardTitle>
          <CardDescription>Manage user tier upgrades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingUpgrades.map((upgrade) => (
              <div key={upgrade.id} className="flex items-center justify-between">
                <div>
                  <p>{upgrade.user?.username}</p>
                  <p>{upgrade.user?.email}</p>
                  <p>Current Tier: {upgrade.user?.current_tier}</p>
                  <p>New Tier: {upgrade.tier_name}</p>
                  <p>Amount: {upgrade.amount}</p>
                  <p>Reference: {upgrade.reference}</p>
                  <p>Created At: {upgrade.created_at}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button onClick={() => handleApproveUpgrade(upgrade.id)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button onClick={() => handleRejectUpgrade(upgrade.id)} variant="destructive">
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tier Stats Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Stats</CardTitle>
          <CardDescription>View tier upgrade statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p>Total Upgrades: {stats?.total_upgrades}</p>
              <p>Pending Approvals: {stats?.pending_approvals}</p>
              <p>Revenue Today: {stats?.revenue_today}</p>
              <p>Revenue Month: {stats?.revenue_month}</p>
            </div>
            <div>
              <p>Tier Distribution:</p>
              {Object.entries(stats?.tier_distribution || {}).map(([tier, count]) => (
                <div key={tier} className="flex items-center space-x-2">
                  <Badge>{tier}</Badge>
                  <p>{count}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Configure tier upgrade settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Manual Approval</Label>
              <Switch
                checked={settings.manual_approval}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, manual_approval: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Auto Upgrade Delay (Minutes)</Label>
              <Input
                type="number"
                value={settings.auto_upgrade_delay_minutes}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, auto_upgrade_delay_minutes: Number.parseInt(e.target.value, 10) }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Max Upgrades Per Day</Label>
              <Input
                type="number"
                value={settings.max_upgrades_per_day}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, max_upgrades_per_day: Number.parseInt(e.target.value, 10) }))
                }
              />
            </div>
            <Button onClick={handleSettingsUpdate}>
              <Settings className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
