"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RefreshCw, CheckCircle, XCircle, Clock, Shield, Activity } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

// Force dynamic rendering
export const dynamic = "force-dynamic"

interface SyncStatus {
  isRunning: boolean
  lastRun: string | null
  totalUsers: number
  orphanedAuth: number
  orphanedDb: number
  inconsistencies: number
}

interface SyncOptions {
  dryRun: boolean
  updateExisting: boolean
  createMissing: boolean
  deleteOrphaned: boolean
}

interface SyncResult {
  success: boolean
  message: string
  details: {
    created: number
    updated: number
    deleted: number
    errors: string[]
  }
}

export default function AdminSyncPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isRunning: false,
    lastRun: null,
    totalUsers: 0,
    orphanedAuth: 0,
    orphanedDb: 0,
    inconsistencies: 0,
  })
  const [syncOptions, setSyncOptions] = useState<SyncOptions>({
    dryRun: true,
    updateExisting: true,
    createMissing: true,
    deleteOrphaned: false,
  })
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!loading && (!profile || profile.tier !== "admin")) {
      router.push("/dashboard")
      return
    }

    fetchSyncStatus()
  }, [profile, loading, router])

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch("/api/admin/sync/users")
      if (response.ok) {
        const data = await response.json()
        setSyncStatus(data.status)
      }
    } catch (error) {
      console.error("Error fetching sync status:", error)
    }
  }

  const handleSync = async () => {
    setIsLoading(true)
    setSyncResult(null)

    try {
      const response = await fetch("/api/admin/sync/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(syncOptions),
      })

      const data = await response.json()

      if (response.ok) {
        setSyncResult(data.result)
        await fetchSyncStatus()
      } else {
        setSyncResult({
          success: false,
          message: data.error || "Sync failed",
          details: { created: 0, updated: 0, deleted: 0, errors: [data.error || "Unknown error"] },
        })
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: "Network error occurred",
        details: { created: 0, updated: 0, deleted: 0, errors: ["Network error"] },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleIntegrityCheck = async () => {
    setIsLoading(true)
    try {
      await fetchSyncStatus()
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-white">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!profile || profile.tier !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Admin privileges required to access this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">User Data Synchronization</h1>
          <p className="text-gray-300">Manage and synchronize user data between authentication and database</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Status */}
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{syncStatus.totalUsers}</div>
                    <div className="text-sm text-gray-300">Total Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{syncStatus.orphanedAuth}</div>
                    <div className="text-sm text-gray-300">Auth Only</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">{syncStatus.orphanedDb}</div>
                    <div className="text-sm text-gray-300">DB Only</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{syncStatus.inconsistencies}</div>
                    <div className="text-sm text-gray-300">Issues</div>
                  </div>
                </div>

                <Separator className="my-4 bg-white/20" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-300">
                      Last sync: {syncStatus.lastRun ? new Date(syncStatus.lastRun).toLocaleString() : "Never"}
                    </span>
                  </div>
                  <Badge variant={syncStatus.isRunning ? "destructive" : "secondary"}>
                    {syncStatus.isRunning ? "Running" : "Idle"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Sync Results */}
            {syncResult && (
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    {syncResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                    Sync Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className={syncResult.success ? "border-green-500/50" : "border-red-500/50"}>
                    <AlertDescription className="text-white">{syncResult.message}</AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-400">{syncResult.details.created}</div>
                      <div className="text-sm text-gray-300">Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-400">{syncResult.details.updated}</div>
                      <div className="text-sm text-gray-300">Updated</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-400">{syncResult.details.deleted}</div>
                      <div className="text-sm text-gray-300">Deleted</div>
                    </div>
                  </div>

                  {syncResult.details.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-red-400 mb-2">Errors:</h4>
                      <ul className="space-y-1">
                        {syncResult.details.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-300">
                            • {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Sync Options */}
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Sync Options</CardTitle>
                <CardDescription className="text-gray-300">Configure synchronization behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dry-run" className="text-white">
                    Dry Run Mode
                  </Label>
                  <Switch
                    id="dry-run"
                    checked={syncOptions.dryRun}
                    onCheckedChange={(checked) => setSyncOptions({ ...syncOptions, dryRun: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="update-existing" className="text-white">
                    Update Existing
                  </Label>
                  <Switch
                    id="update-existing"
                    checked={syncOptions.updateExisting}
                    onCheckedChange={(checked) => setSyncOptions({ ...syncOptions, updateExisting: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="create-missing" className="text-white">
                    Create Missing
                  </Label>
                  <Switch
                    id="create-missing"
                    checked={syncOptions.createMissing}
                    onCheckedChange={(checked) => setSyncOptions({ ...syncOptions, createMissing: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="delete-orphaned" className="text-white">
                    Delete Orphaned
                  </Label>
                  <Switch
                    id="delete-orphaned"
                    checked={syncOptions.deleteOrphaned}
                    onCheckedChange={(checked) => setSyncOptions({ ...syncOptions, deleteOrphaned: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sync Button */}
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-6 text-center">
                <Button onClick={handleSync} disabled={isLoading}>
                  {isLoading ? "Syncing..." : "Sync Users"}
                </Button>
              </CardContent>
            </Card>

            {/* Integrity Check Button */}
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-6 text-center">
                <Button onClick={handleIntegrityCheck} disabled={isLoading}>
                  {isLoading ? "Checking..." : "Check Integrity"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
