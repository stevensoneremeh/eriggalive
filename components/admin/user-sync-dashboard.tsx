"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Users, Database, FolderSyncIcon as Sync } from "lucide-react"
import { toast } from "sonner"

interface SyncResult {
  success: boolean
  processed: number
  created: number
  updated: number
  deleted: number
  errors: string[]
  orphanedAuth: string[]
  orphanedDatabase: number[]
}

interface SyncLog {
  id: number
  sync_type: string
  status: string
  dry_run: boolean
  processed_count: number
  created_count: number
  updated_count: number
  deleted_count: number
  error_count: number
  details: any
  created_at: string
}

interface IntegrityIssue {
  type: string
  description: string
  userId?: string | number
}

export function UserSyncDashboard() {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [integrityIssues, setIntegrityIssues] = useState<IntegrityIssue[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<SyncResult | null>(null)

  // Sync options
  const [dryRun, setDryRun] = useState(true)
  const [deleteOrphaned, setDeleteOrphaned] = useState(false)
  const [updateExisting, setUpdateExisting] = useState(true)
  const [createMissing, setCreateMissing] = useState(true)

  const fetchSyncStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/sync/users")
      if (!response.ok) {
        throw new Error("Failed to fetch sync status")
      }

      const data = await response.json()
      setSyncLogs(data.syncLogs || [])
      setIntegrityIssues(data.integrityCheck?.issues || [])
    } catch (error) {
      console.error("Error fetching sync status:", error)
      toast.error("Failed to fetch sync status")
    } finally {
      setIsLoading(false)
    }
  }

  const performSync = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch("/api/admin/sync/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dryRun,
          deleteOrphaned,
          updateExisting,
          createMissing,
        }),
      })

      if (!response.ok) {
        throw new Error("Sync failed")
      }

      const data = await response.json()
      setLastSync(data.result)
      toast.success(data.message)

      // Refresh status after sync
      await fetchSyncStatus()
    } catch (error) {
      console.error("Error performing sync:", error)
      toast.error("Sync operation failed")
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    fetchSyncStatus()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case "running":
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getIssueIcon = (type: string) => {
    switch (type) {
      case "duplicate_username":
      case "invalid_email":
      case "negative_coins":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Synchronization</h1>
          <p className="text-muted-foreground">Manage user data synchronization between auth and database</p>
        </div>
        <Button onClick={fetchSyncStatus} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="sync" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sync">Sync Control</TabsTrigger>
          <TabsTrigger value="logs">Sync Logs</TabsTrigger>
          <TabsTrigger value="integrity">Data Integrity</TabsTrigger>
        </TabsList>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sync className="h-5 w-5" />
                Synchronization Options
              </CardTitle>
              <CardDescription>Configure and execute user data synchronization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="dry-run" checked={dryRun} onCheckedChange={setDryRun} />
                  <Label htmlFor="dry-run">Dry Run (Preview Only)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="update-existing" checked={updateExisting} onCheckedChange={setUpdateExisting} />
                  <Label htmlFor="update-existing">Update Existing Users</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="create-missing" checked={createMissing} onCheckedChange={setCreateMissing} />
                  <Label htmlFor="create-missing">Create Missing Users</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="delete-orphaned"
                    checked={deleteOrphaned}
                    onCheckedChange={setDeleteOrphaned}
                    disabled={dryRun}
                  />
                  <Label htmlFor="delete-orphaned">Delete Orphaned Records</Label>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ready to synchronize</p>
                  <p className="text-sm text-muted-foreground">
                    {dryRun
                      ? "This will preview changes without making modifications"
                      : "This will modify your database"}
                  </p>
                </div>
                <Button onClick={performSync} disabled={isSyncing} size="lg">
                  {isSyncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Sync className="h-4 w-4 mr-2" />
                      {dryRun ? "Preview Sync" : "Start Sync"}
                    </>
                  )}
                </Button>
              </div>

              {lastSync && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Last sync: Processed {lastSync.processed}, Created {lastSync.created}, Updated {lastSync.updated}
                    {lastSync.deleted > 0 && `, Deleted ${lastSync.deleted}`}
                    {lastSync.errors.length > 0 && `, ${lastSync.errors.length} errors`}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Synchronization History
              </CardTitle>
              <CardDescription>Recent synchronization operations</CardDescription>
            </CardHeader>
            <CardContent>
              {syncLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No sync logs found</p>
              ) : (
                <div className="space-y-4">
                  {syncLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(log.status)}
                          {log.dry_run && <Badge variant="outline">Dry Run</Badge>}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Processed:</span> {log.processed_count}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span> {log.created_count}
                        </div>
                        <div>
                          <span className="font-medium">Updated:</span> {log.updated_count}
                        </div>
                        <div>
                          <span className="font-medium">Errors:</span> {log.error_count}
                        </div>
                      </div>
                      {log.details?.errors?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-red-600">Errors:</p>
                          <ul className="text-sm text-red-600 list-disc list-inside">
                            {log.details.errors.slice(0, 3).map((error: string, index: number) => (
                              <li key={index}>{error}</li>
                            ))}
                            {log.details.errors.length > 3 && <li>... and {log.details.errors.length - 3} more</li>}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Data Integrity Check
              </CardTitle>
              <CardDescription>Identify and resolve data consistency issues</CardDescription>
            </CardHeader>
            <CardContent>
              {integrityIssues.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>No data integrity issues found. Your user data is consistent.</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Found {integrityIssues.length} data integrity issue{integrityIssues.length !== 1 ? "s" : ""} that
                      need attention.
                    </AlertDescription>
                  </Alert>
                  {integrityIssues.map((issue, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      {getIssueIcon(issue.type)}
                      <div className="flex-1">
                        <p className="font-medium">{issue.type.replace(/_/g, " ").toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">{issue.description}</p>
                        {issue.userId && <p className="text-xs text-muted-foreground mt-1">User ID: {issue.userId}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
