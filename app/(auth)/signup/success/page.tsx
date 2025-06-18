"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Coins, Gift, ArrowRight } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function SignupSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile, isAuthenticated } = useAuth()
  const [countdown, setCountdown] = useState(5)

  // Get user details from URL params or auth context
  const username = searchParams.get("username") || profile?.username || "Fan"
  const fullName = searchParams.get("fullName") || profile?.full_name || "New Fan"

  // Redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push("/dashboard")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/signup")
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background to-muted/20">
      <Card className="max-w-2xl w-full bg-card/80 backdrop-blur-sm border-green-500/30 shadow-2xl">
        <CardContent className="p-12 text-center">
          {/* Success Animation */}
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
              <Check className="h-16 w-16 text-white" />
            </div>
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
              <Gift className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Welcome Message */}
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Welcome to the Movement!
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Congratulations <span className="font-semibold text-primary">{fullName}</span>, your Erigga fan account is
            ready!
          </p>

          {/* Welcome Benefits */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Coins Bonus */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center justify-center mb-4">
                <Coins className="h-10 w-10 text-yellow-600 mr-3" />
                <span className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">100</span>
              </div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Welcome Coins</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Start your journey with 100 free coins to unlock exclusive content!
              </p>
            </div>

            {/* Grassroot Tier */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center mb-4">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
              </div>
              <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">Grassroot Tier</h3>
              <p className="text-sm text-green-700 dark:text-green-400">
                Your starting tier with access to community features and basic content.
              </p>
            </div>
          </div>

          {/* Account Summary */}
          <div className="bg-muted/50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold mb-4">Your Account Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-left">
                <span className="text-muted-foreground block">Username</span>
                <span className="font-medium">@{username}</span>
              </div>
              <div className="text-left">
                <span className="text-muted-foreground block">Membership</span>
                <span className="font-medium text-green-600">Grassroot</span>
              </div>
              <div className="text-left">
                <span className="text-muted-foreground block">Starting Balance</span>
                <span className="font-medium text-yellow-600">100 Coins</span>
              </div>
              <div className="text-left">
                <span className="text-muted-foreground block">Status</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-primary/10 rounded-xl p-6 mb-8">
            <h3 className="font-semibold mb-4">What's Next?</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold text-xs">1</span>
                </div>
                <p className="font-medium">Explore Dashboard</p>
                <p className="text-muted-foreground">Check out your personalized dashboard</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold text-xs">2</span>
                </div>
                <p className="font-medium">Join Community</p>
                <p className="text-muted-foreground">Connect with other Erigga fans</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold text-xs">3</span>
                </div>
                <p className="font-medium">Unlock Content</p>
                <p className="text-muted-foreground">Use your coins for exclusive access</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => router.push("/community")} className="px-8">
              Explore Community
            </Button>
          </div>

          {/* Auto Redirect Notice */}
          <div className="mt-8 text-sm text-muted-foreground">
            <p>Automatically redirecting to dashboard in {countdown} seconds...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
