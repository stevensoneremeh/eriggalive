"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { TierUpgrade } from "@/components/tier-upgrade"
import { TierAccessControl } from "@/components/tier-access-control"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Crown, Star, Zap, Shield } from "lucide-react"

export default function PremiumPage() {
  const { profile } = useAuth()
  const searchParams = useSearchParams()
  const showUpgrade = searchParams.get("upgrade") === "true"
  const [activeTab, setActiveTab] = useState(showUpgrade ? "upgrade" : "overview")

  useEffect(() => {
    if (showUpgrade) {
      setActiveTab("upgrade")
    }
  }, [showUpgrade])

  const handleUpgradeSuccess = (newTier: string) => {
    // Refresh the page to update the UI with new tier
    window.location.reload()
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="font-street text-4xl md:text-6xl text-gradient mb-4">JOIN THE CIRCLE</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get closer to the culture. Unlock exclusive content, early access, and VIP experiences.
          </p>
          {profile?.tier && (
            <Badge variant="outline" className="mt-4 text-lg px-4 py-2">
              Your Current Tier: {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)}
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="upgrade" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Upgrade
            </TabsTrigger>
            <TabsTrigger value="benefits" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Benefits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Tier Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  name: "Grassroot",
                  price: "Free",
                  color: "text-gray-500",
                  icon: Star,
                  features: ["Community access", "Basic profile", "Standard support"],
                },
                {
                  name: "Pioneer",
                  price: "₦2,500/mo",
                  color: "text-orange-500",
                  icon: Crown,
                  popular: true,
                  features: ["Early access", "Exclusive content", "10% merch discount"],
                },
                {
                  name: "Elder",
                  price: "₦5,000/mo",
                  color: "text-yellow-500",
                  icon: Shield,
                  features: ["VIP access", "20% discount", "Monthly calls"],
                },
                {
                  name: "Blood",
                  price: "₦10,000/mo",
                  color: "text-red-500",
                  icon: Zap,
                  features: ["Backstage access", "30% discount", "Direct contact"],
                },
              ].map((tier) => {
                const Icon = tier.icon
                const isCurrent = profile?.tier === tier.name.toLowerCase()

                return (
                  <Card key={tier.name} className={`relative ${isCurrent ? "ring-2 ring-current ring-offset-2" : ""}`}>
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-orange-500 text-white">Most Popular</Badge>
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute -top-3 right-4">
                        <Badge className="bg-green-500 text-white">Current</Badge>
                      </div>
                    )}

                    <CardHeader className="text-center">
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${tier.color} bg-current/10`}
                      >
                        <Icon className="h-8 w-8" />
                      </div>
                      <CardTitle className={tier.color}>{tier.name}</CardTitle>
                      <div className="text-2xl font-bold">{tier.price}</div>
                    </CardHeader>

                    <CardContent>
                      <ul className="space-y-2">
                        {tier.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <div className="h-2 w-2 bg-current rounded-full flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Premium Content Preview */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center">Premium Content Preview</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TierAccessControl requiredTier="pioneer" showUpgrade={true}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Exclusive Behind-the-Scenes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Get access to exclusive studio sessions, recording processes, and personal moments.</p>
                    </CardContent>
                  </Card>
                </TierAccessControl>

                <TierAccessControl requiredTier="elder" showUpgrade={true}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Video Calls</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Join monthly video calls with Erigga and other Elder tier members.</p>
                    </CardContent>
                  </Card>
                </TierAccessControl>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upgrade" className="space-y-6">
            <TierUpgrade onUpgradeSuccess={handleUpgradeSuccess} />
          </TabsContent>

          <TabsContent value="benefits" className="space-y-6">
            {/* Benefits Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-2xl">Tier Benefits Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-4 px-2">Benefits</th>
                        <th className="text-center py-4 px-2 text-gray-500">Grassroot</th>
                        <th className="text-center py-4 px-2 text-orange-500">Pioneer</th>
                        <th className="text-center py-4 px-2 text-yellow-500">Elder</th>
                        <th className="text-center py-4 px-2 text-red-500">Blood</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Community Access", "✓", "✓", "✓", "✓"],
                        ["Exclusive Content", "✗", "✓", "✓", "✓"],
                        ["Early Music Access", "✗", "✓", "✓", "✓"],
                        ["Merch Discounts", "✗", "10%", "20%", "30%"],
                        ["VIP Event Access", "✗", "✗", "✓", "✓"],
                        ["Backstage Access", "✗", "✗", "✗", "✓"],
                        ["Direct Artist Contact", "✗", "✗", "✓", "✓"],
                      ].map(([benefit, grassroot, pioneer, elder, blood], index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-2 font-medium">{benefit}</td>
                          <td className="text-center py-3 px-2">{grassroot}</td>
                          <td className="text-center py-3 px-2">{pioneer}</td>
                          <td className="text-center py-3 px-2">{elder}</td>
                          <td className="text-center py-3 px-2">{blood}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
