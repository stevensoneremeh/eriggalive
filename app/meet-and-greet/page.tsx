
'use client'

import { Suspense, lazy } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Dynamically import components that might cause SSR issues
const Scene3D = lazy(() => import('@/components/meet-greet/scene-3d').catch(() => ({
  default: () => <div className="w-full h-64 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white">3D Scene Loading...</div>
})))

const BookingModal = lazy(() => import('@/components/meet-greet/booking-modal').catch(() => ({
  default: () => <div>Booking component unavailable</div>
})))

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Skeleton className="h-12 w-96 mx-auto mb-4" />
          <Skeleton className="h-6 w-64 mx-auto" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function MeetAndGreetPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 to-pink-600 bg-clip-text text-transparent mb-4">
            Meet & Greet with Erigga
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Book an exclusive virtual meet and greet session with Erigga. Connect, chat, and create unforgettable memories!
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* 3D Scene Card */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Virtual Phone Booth</CardTitle>
              <CardDescription className="text-white/70">
                Experience the future of fan interaction in our immersive 3D environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-64 w-full rounded-lg overflow-hidden">
                <Suspense fallback={
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 animate-pulse rounded-lg flex items-center justify-center text-white">
                    Loading 3D Scene...
                  </div>
                }>
                  <Scene3D />
                </Suspense>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form Card */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Book Your Session</CardTitle>
              <CardDescription className="text-white/70">
                Select your preferred time slot and payment method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-10 w-32" />
                </div>
              }>
                <BookingModal />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              title: "HD Video Call",
              description: "Crystal clear video quality for the best experience",
              icon: "🎥"
            },
            {
              title: "Personal Chat",
              description: "One-on-one conversation with Erigga himself",
              icon: "💬"
            },
            {
              title: "Photo Opportunity",
              description: "Take screenshots during your session to keep forever",
              icon: "📸"
            }
          ].map((feature, index) => (
            <Card key={index} className="bg-white/5 backdrop-blur-sm border-white/10 text-center">
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-white text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/70 text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pricing Info */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-yellow-500/20 to-pink-500/20 backdrop-blur-md border-yellow-500/30 max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-yellow-400 text-3xl font-bold mb-2">₦5,000</div>
              <div className="text-white/80 text-sm mb-4">5-minute session</div>
              <div className="text-yellow-300 text-xs">
                * Payment via Paystack or Erigga Coins
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
