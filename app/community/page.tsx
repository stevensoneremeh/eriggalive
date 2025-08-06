'use client'

import { AuthGuard } from '@/components/auth-guard'
import { CompleteWorkingClient } from './complete-working/complete-working-client'

export default function CommunityPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Community Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Erigga Community</h1>
                <p className="text-muted-foreground mt-1">
                  Connect with fellow fans, share your thoughts, and stay updated
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Join the conversation</p>
                  <p className="text-xs text-muted-foreground">Share your bars, discuss music</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Community Content */}
        <CompleteWorkingClient />
      </div>
    </AuthGuard>
  )
}
