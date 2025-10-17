"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Crown, Shield, Zap, Droplets } from "lucide-react"

const plans = [
  {
    name: "Grassroot",
    price: "Free",
    icon: Star,
    color: "text-gray-400",
    bgColor: "bg-gray-400/10",
    borderColor: "border-gray-400/20",
    features: ["Access to community feed", "Basic profile customization", "Standard support", "Public content access"],
    limitations: ["No exclusive content", "Limited community features", "No premium badges"],
  },
  {
    name: "Pioneer",
    price: "₦2,500",
    period: "/month",
    icon: Crown,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/40",
    popular: true,
    features: [
      "Early access to new drops",
      "Exclusive behind-the-scenes content",
      "10% discount on merch",
      "Priority event tickets",
      "Pioneer profile badge",
      "Access to premium discussions",
      "Monthly exclusive freestyles",
    ],
  },
  {
    name: "Elder",
    price: "₦5,000",
    period: "/month",
    icon: Shield,
    color: "text-gold-400",
    bgColor: "bg-gold-400/10",
    borderColor: "border-gold-400/40",
    features: [
      "Everything in Pioneer",
      "VIP access to all events",
      "20% discount on merch & tickets",
      "Direct access to exclusive content",
      "Elder Circle badge",
      "Monthly video calls with Erigga",
      "First access to new music",
      "Exclusive merchandise",
      "Premium customer support",
    ],
  },
  {
    name: "Blood",
    price: "₦10,000",
    period: "/month",
    icon: Droplets,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/40",
    features: [
      "Everything in Elder",
      "Backstage access at events",
      "30% discount on all purchases",
      "Personalized birthday message",
      "Blood badge (highest tier)",
      "Quarterly private sessions",
      "Input on upcoming releases",
      "Limited edition merchandise",
      "Direct contact with Erigga",
      "Lifetime membership benefits",
    ],
  },
]

export default function PremiumPage() {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="font-street text-4xl md:text-6xl text-gradient mb-4">JOIN THE CIRCLE</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get closer to the culture. Unlock exclusive content, early access, and VIP experiences.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon

            return (
              <Card
                key={plan.name}
                className={`relative ${plan.bgColor} ${plan.borderColor} border-2 hover:scale-105 transition-all duration-300 ${plan.popular ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-background" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-orange-500 text-black font-bold px-4 py-1">MOST POPULAR</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-16 h-16 ${plan.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}
                  >
                    <Icon className={`h-8 w-8 ${plan.color}`} />
                  </div>
                  <CardTitle className={`text-2xl font-street ${plan.color}`}>{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {plan.price}
                    {plan.period && <span className="text-lg text-muted-foreground">{plan.period}</span>}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}

                    {plan.limitations?.map((limitation, index) => (
                      <div key={index} className="flex items-center gap-3 opacity-50">
                        <div className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm line-through">{limitation}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={`w-full mt-6 ${
                      plan.name === "Grassroot"
                        ? "bg-gray-600 hover:bg-gray-700"
                        : plan.name === "Pioneer"
                          ? "bg-orange-500 hover:bg-orange-600 text-black"
                          : plan.name === "Elder"
                            ? "bg-gold-400 hover:bg-gold-500 text-black"
                            : "bg-red-500 hover:bg-red-600 text-white"
                    } font-bold`}
                  >
                    {plan.name === "Grassroot" ? "Current Plan" : "Subscribe Now"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Benefits Comparison */}
        <Card className="bg-card/50 border-orange-500/20 mb-12">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-street text-gradient">TIER COMPARISON</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-orange-500/20">
                    <th className="text-left py-4 px-2">Features</th>
                    <th className="text-center py-4 px-2 text-gray-400">Grassroot</th>
                    <th className="text-center py-4 px-2 text-orange-500">Pioneer</th>
                    <th className="text-center py-4 px-2 text-gold-400">Elder</th>
                    <th className="text-center py-4 px-2 text-red-500">Blood</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {[
                    ["Community Access", true, true, true, true],
                    ["Exclusive Content", false, true, true, true],
                    ["Early Music Access", false, true, true, true],
                    ["Merch Discounts", false, "10%", "20%", "30%"],
                    ["VIP Event Access", false, false, true, true],
                    ["Backstage Access", false, false, false, true],
                    ["Direct Artist Access", false, false, true, true],
                    ["Premium Badge", false, true, true, true],
                    ["Private Sessions", false, false, "Monthly", "Quarterly"],
                    ["Limited Edition Merch", false, false, true, true],
                  ].map(([feature, grassroot, pioneer, elder, blood], index) => (
                    <tr key={index} className="border-b border-orange-500/10">
                      <td className="py-3 px-2 font-medium">{feature}</td>
                      <td className="text-center py-3 px-2">
                        {grassroot === true ? (
                          <Check className="h-4 w-4 text-green-500 mx-auto" />
                        ) : grassroot === false ? (
                          <span className="text-red-500">✕</span>
                        ) : (
                          grassroot
                        )}
                      </td>
                      <td className="text-center py-3 px-2">
                        {pioneer === true ? (
                          <Check className="h-4 w-4 text-green-500 mx-auto" />
                        ) : pioneer === false ? (
                          <span className="text-red-500">✕</span>
                        ) : (
                          pioneer
                        )}
                      </td>
                      <td className="text-center py-3 px-2">
                        {elder === true ? (
                          <Check className="h-4 w-4 text-green-500 mx-auto" />
                        ) : elder === false ? (
                          <span className="text-red-500">✕</span>
                        ) : (
                          elder
                        )}
                      </td>
                      <td className="text-center py-3 px-2">
                        {blood === true ? (
                          <Check className="h-4 w-4 text-green-500 mx-auto" />
                        ) : blood === false ? (
                          <span className="text-red-500">✕</span>
                        ) : (
                          blood
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card className="bg-gradient-to-r from-orange-500/10 to-gold-400/10 border-orange-500/20">
          <CardContent className="p-8 text-center">
            <Zap className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Secure Payment with Paystack</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              All payments are processed securely through Paystack. Cancel anytime. Your subscription helps support
              Erigga and the community.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span>• Secure Payment</span>
              <span>• Cancel Anytime</span>
              <span>• Instant Access</span>
              <span>• 24/7 Support</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
