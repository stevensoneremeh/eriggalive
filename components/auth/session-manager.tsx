"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { enhancedAuthService } from "@/lib/auth/enhanced-auth-service"
import { useAuth } from "@/contexts/auth-context"
import { Smartphone, Monitor, Tablet, MapPin, Clock, Shield, LogOut, AlertTriangle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface UserSession {
  id: string
  sessionToken: string
  deviceInfo: {
    browser: string
    os: string
    platform: string
    isMobile: boolean
  }
  ipAddress: string
  isActive: boolean
  rememberMe: boolean
  lastActivity: Date
  createdAt: Date
  expiresAt: Date
}

export function SessionManager() {
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [loading, setLoading] = useState(true)
  const { user, sessionToken, signOutAllDevices } = useAuth()

  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const userSessions = await enhancedAuthService.getUserSessions(user!.id)
      setSessions(userSessions)
    } catch (error) {
      console.error("Error loading sessions:", error)
      toast({
        title: "Error",
        description: "Failed to load sessions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const terminateSession = async (sessionTokenToTerminate: string) => {
    try {
      await enhancedAuthService.logout(sessionTokenToTerminate, user!.id)
      await loadSessions()

      toast({
        title: "Session terminated",
        description: "The session has been successfully terminated",
      })
    } catch (error) {
      console.error("Error terminating session:", error)
      toast({
        title: "Error",
        description: "Failed to terminate session",
        variant: "destructive",
      })
    }
  }

  const handleSignOutAllDevices = async () => {
    try {
      await signOutAllDevices()
      toast({
        title: "All sessions terminated",
        description: "You have been signed out from all devices",
      })
    } catch (error) {
      console.error("Error signing out all devices:", error)
      toast({
        title: "Error",
        description: "Failed to sign out from all devices",
        variant: "destructive",
      })
    }
  }

  const getDeviceIcon = (deviceInfo: UserSession["deviceInfo"]) => {
    if (deviceInfo.isMobile) return <Smartphone className="h-4 w-4" />
    if (deviceInfo.platform.includes("iPad")) return <Tablet className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }

  const formatLastActivity = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Loading your active sessions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Active Sessions
        </CardTitle>
        <CardDescription>
          Manage your active sessions across devices. Maximum 3 concurrent sessions allowed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length >= 3 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have reached the maximum number of concurrent sessions (3). New logins will automatically terminate
              the oldest session.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-4 border rounded-lg ${
                session.sessionToken === sessionToken ? "border-lime-500 bg-lime-50 dark:bg-lime-950" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getDeviceIcon(session.deviceInfo)}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {session.deviceInfo.browser} on {session.deviceInfo.os}
                      </span>
                      {session.sessionToken === sessionToken && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                      {session.rememberMe && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Remembered
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {session.ipAddress}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatLastActivity(session.lastActivity)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Expires: {session.expiresAt.toLocaleDateString()} at {session.expiresAt.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                {session.sessionToken !== sessionToken && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => terminateSession(session.sessionToken)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <LogOut className="h-3 w-3 mr-1" />
                    Terminate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {sessions.length > 1 && (
          <div className="pt-4 border-t">
            <Button variant="destructive" onClick={handleSignOutAllDevices} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out From All Devices
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
