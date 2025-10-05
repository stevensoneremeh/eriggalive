"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy } from "lucide-react"

export default function TiersManagementPage() {
  const tiers = [
    {
      name: "Grassroot",
      price: "Free",
      features: ["Basic access", "Community posts", "Free content"],
    },
    {
      name: "Pioneer",
      price: "₦5,000/month",
      features: ["All Grassroot features", "Exclusive content", "Early access"],
    },
    {
      name: "Elder",
      price: "₦15,000/month",
      features: ["All Pioneer features", "Live events", "VIP access"],
    },
    {
      name: "Blood",
      price: "₦50,000/month",
      features: ["All Elder features", "Direct access to Erigga", "Premium perks"],
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tiers Management</h1>
        <p className="text-muted-foreground">Manage subscription tiers and pricing</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => (
          <Card key={tier.name}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="mr-2 h-5 w-5" />
                {tier.name}
              </CardTitle>
              <CardDescription className="text-lg font-semibold">
                {tier.price}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {tier.features.map((feature, index) => (
                  <li key={index} className="text-sm flex items-start">
                    <span className="mr-2">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tier Information</CardTitle>
          <CardDescription>
            Subscription tiers are configured in the database. Contact system administrator to modify tier pricing and permissions.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
