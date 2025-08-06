'use client'

import { useAuth } from '@/contexts/auth-context'
import { CompleteWorkingClient } from './complete-working/complete-working-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MessageSquare, Users, TrendingUp } from 'lucide-react'

export default function CommunityPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Join the Community</h2>
              <p className="text-muted-foreground mb-4">
                Connect with other fans, share your thoughts, and be part of the Erigga community.
              </p>
            </div>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/signup">Create Account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Community Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Community</h1>
              <p className="text-muted-foreground mt-1">
                Connect, share, and engage with fellow fans
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Active Community</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>Growing Daily</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Community Content */}
      <CompleteWorkingClient />
    </div>
  )
}
