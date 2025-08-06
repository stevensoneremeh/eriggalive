'use client'

import { Suspense } from 'react'
import CompleteWorkingClient from './complete-working/complete-working-client'
import { Card, CardContent } from '@/components/ui/card'
import { Users, MessageSquare, TrendingUp } from 'lucide-react'

function CommunityHeader() {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-8 px-4 mb-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-2">Erigga Live Community</h1>
          <p className="text-blue-100 text-lg">Connect, Share, and Vibe with Fellow Fans</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-200" />
              <div className="text-2xl font-bold">10K+</div>
              <div className="text-blue-200 text-sm">Active Members</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-green-200" />
              <div className="text-2xl font-bold">50K+</div>
              <div className="text-blue-200 text-sm">Posts & Comments</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-200" />
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-blue-200 text-sm">Active Discussions</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function CommunityLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <CommunityHeader />
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading community...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <CommunityHeader />
      <Suspense fallback={<CommunityLoading />}>
        <CompleteWorkingClient />
      </Suspense>
    </div>
  )
}
