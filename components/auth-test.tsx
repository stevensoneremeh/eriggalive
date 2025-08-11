"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, User, Mail, Shield, Coins } from "lucide-react"

export function AuthTest() {
  const { user, session, profile, loading, isAuthenticated, signOut } = useAuth()

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Authentication Test - Loading
          </CardTitle>
          <CardDescription>Testing authentication system...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isAuthenticated ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          Authentication Test
        </CardTitle>
        <CardDescription>
          {isAuthenticated ? "Authentication system is working!" : "User is not authenticated"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Authentication Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Authentication Status</h3>
            <Badge variant={isAuthenticated ? "default" : "destructive"}>
              {isAuthenticated ? "Authenticated" : "Not Authenticated"}
            </Badge>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Loading State</h3>
            <Badge variant={loading ? "secondary" : "outline"}>{loading ? "Loading" : "Ready"}</Badge>
          </div>
        </div>

        {/* User Information */}
        {user && (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              User Information
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="font-medium">Email:</span>
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="font-medium">User ID:</span>
                <span className="font-mono text-sm">{user.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Email Confirmed:</span>
                <Badge variant={user.email_confirmed_at ? "default" : "secondary"}>
                  {user.email_confirmed_at ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Profile Information */}
        {profile && (
          <div className="space-y-4">
            <h3 className="font-semibold">Profile Information</h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Username:</span>
                <span>{profile.username || "Not set"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Full Name:</span>
                <span>{profile.full_name || "Not set"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Tier:</span>
                <Badge>{profile.tier || "grassroot"}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">Coins:</span>
                <span>{profile.coins || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Active:</span>
                <Badge variant={profile.is_active ? "default" : "destructive"}>
                  {profile.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Session Information */}
        {session && (
          <div className="space-y-4">
            <h3 className="font-semibold">Session Information</h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Token Type:</span>
                <span>{session.token_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Expires At:</span>
                <span>{session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : "Never"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t">
          {isAuthenticated ? (
            <Button onClick={signOut} variant="destructive">
              Sign Out
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button asChild>
                <a href="/login">Sign In</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/signup">Sign Up</a>
              </Button>
            </div>
          )}
        </div>

        {/* Debug Information */}
        <details className="space-y-2">
          <summary className="font-semibold cursor-pointer">Debug Information</summary>
          <div className="bg-muted/50 rounded-lg p-4">
            <pre className="text-xs overflow-auto">
              {JSON.stringify(
                {
                  user: user ? { id: user.id, email: user.email, email_confirmed_at: user.email_confirmed_at } : null,
                  profile: profile
                    ? {
                        username: profile.username,
                        tier: profile.tier,
                        coins: profile.coins,
                        is_active: profile.is_active,
                      }
                    : null,
                  session: session ? { token_type: session.token_type, expires_at: session.expires_at } : null,
                  loading,
                  isAuthenticated,
                },
                null,
                2,
              )}
            </pre>
          </div>
        </details>
      </CardContent>
    </Card>
  )
}
