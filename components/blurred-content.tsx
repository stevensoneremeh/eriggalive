"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Lock, Coins } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface BlurredContentProps {
  children: React.ReactNode
  requiredTier: "pioneer" | "elder" | "blood"
  contentType: string
  contentId: number
  coinPrice: number
  title: string
}

export function BlurredContent({
  children,
  requiredTier,
  contentType,
  contentId,
  coinPrice,
  title,
}: BlurredContentProps) {
  const { profile, spendCoins } = useAuth()
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [unlocked, setUnlocked] = useState(false)

  // Check if user has access based on tier
  const hasTierAccess = () => {
    if (!profile) return false

    const tierLevels = {
      grassroot: 0,
      pioneer: 1,
      elder: 2,
      blood: 3,
    }

    const userLevel = tierLevels[profile.tier]
    const requiredLevel = tierLevels[requiredTier]

    return userLevel >= requiredLevel
  }

  const handleUnlock = async () => {
    setIsUnlocking(true)

    try {
      const success = await spendCoins(coinPrice, contentType, contentId)

      if (success) {
        setUnlocked(true)
        setIsDialogOpen(false)
      } else {
        // Handle failure
        alert("Failed to unlock content. Please try again.")
      }
    } catch (error) {
      console.error("Error unlocking content:", error)
    } finally {
      setIsUnlocking(false)
    }
  }

  // If user has tier access or has unlocked with coins, show content
  if (hasTierAccess() || unlocked) {
    return <>{children}</>
  }

  // Otherwise show blurred content with unlock option
  return (
    <div className="relative">
      <div className="filter blur-md pointer-events-none">{children}</div>

      <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-black">
              <Lock className="h-4 w-4 mr-2" />
              Unlock Content
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unlock Premium Content</DialogTitle>
              <DialogDescription>Unlock "{title}" using Erigga Coins</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span>Price</span>
                <div className="flex items-center font-bold">
                  <Coins className="h-4 w-4 text-yellow-500 mr-1" />
                  {coinPrice} Coins
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span>Your Balance</span>
                <div className="flex items-center font-bold">
                  <Coins className="h-4 w-4 text-yellow-500 mr-1" />
                  {profile?.coins || 0} Coins
                </div>
              </div>

              {profile && profile.coins < coinPrice && (
                <p className="text-sm text-red-500">
                  You don't have enough coins. Purchase more to unlock this content.
                </p>
              )}

              <div className="flex gap-4">
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-black"
                  onClick={handleUnlock}
                  disabled={isUnlocking || !profile || profile.coins < coinPrice}
                >
                  {isUnlocking ? "Unlocking..." : "Unlock Now"}
                </Button>

                <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Or{" "}
                <a href="/premium" className="text-orange-500 hover:underline">
                  upgrade your membership
                </a>{" "}
                for unlimited access
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
