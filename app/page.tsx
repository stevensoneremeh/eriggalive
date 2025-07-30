"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Music, Video, Users, ShoppingBag, Calendar, Newspaper } from "lucide-react"
import { cn } from "@/lib/utils"
import { SafeHeroVideoCarousel } from "@/components/safe-hero-video-carousel"
import EriggaRadio from "@/components/erigga-radio"

const featuredContent = [
  {
    id: 1,
    title: "Latest Track: Paper Boi",
    description: "The hottest new release from Erigga",
    type: "music",
    thumbnail: "/images/hero/erigga1.jpeg",
    duration: "3:45",
  },
  {
    id: 2,
    title: "Behind the Scenes",
    description: "Exclusive studio footage",
    type: "video",
    thumbnail: "/images/hero/erigga2.jpeg",
    duration: "12:30",
  },
  {
    id: 3,
    title: "Live Performance",
    description: "Concert highlights from Lagos",
    type: "video",
    thumbnail: "/images/hero/erigga3.jpeg",
    duration: "8:15",
  },
]

const upcomingEvents = [
  {
    id: 1,
    title: "Meet & Greet Session",
    date: "Dec 25, 2024",
    time: "7:00 PM",
    type: "Virtual",
    price: "500 coins",
  },
  {
    id: 2,
    title: "Live Radio Show",
    date: "Dec 28, 2024",
    time: "8:00 PM",
    type: "Live Stream",
    price: "Free",
  },
  {
    id: 3,
    title: "New Year Concert",
    date: "Dec 31, 2024",
    time: "10:00 PM",
    type: "Live Event",
    price: "₦15,000",
  },
]

const communityStats = [
  { label: "Active Fans", value: "12.5K", icon: Users },
  { label: "Total Streams", value: "2.8M", icon: Video },
  { label: "Community Posts", value: "8.9K", icon: Video },
  { label: "Live Sessions", value: "156", icon: Video },
]

export default function HomePage() {
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Features data
  const features = [
    {
      title: "Media Vault",
      description: "Access Erigga's complete discography, music videos, and exclusive content.",
      icon: Music,
      href: "/vault",
      color: "from-orange-400 to-red-500",
    },
    {
      title: "Erigga Chronicles",
      description: "Follow Erigga's journey through animated stories and documentaries.",
      icon: Video,
      href: "/chronicles",
      color: "from-blue-400 to-purple-500",
    },
    {
      title: "Community",
      description: "Connect with other fans, share content, and participate in discussions.",
      icon: Users,
      href: "/community",
      color: "from-green-400 to-blue-500",
    },
    {
      title: "Merch Store",
      description: "Shop exclusive Erigga merchandise and limited edition items.",
      icon: ShoppingBag,
      href: "/merch",
      color: "from-purple-400 to-pink-500",
    },
    {
      title: "Events & Tickets",
      description: "Get early access to concert tickets and exclusive events.",
      icon: Calendar,
      href: "/tickets",
      color: "from-yellow-400 to-orange-500",
    },
    {
      title: "Premium Tiers",
      description: "Upgrade your experience with exclusive perks and content.",
      icon: Newspaper,
      href: "/premium",
      color: "from-indigo-400 to-purple-500",
    },
  ]

  // Testimonials data
  const testimonials = [
    {
      quote: "Erigga's platform connects me directly with real fans. The community here is authentic.",
      author: "WarriKing23",
      tier: "Blood Brotherhood",
    },
    {
      quote: "The exclusive content in the vault is worth every coin. Can't get this anywhere else!",
      author: "PaperBoi99",
      tier: "Elder",
    },
    {
      quote: "Chronicles series tells Erigga's story in a way I've never seen before. Pure street wisdom.",
      author: "LagosHustler",
      tier: "Pioneer",
    },
  ]

  // Tier plans data
  const tierPlans = [
    {
      name: "Grassroot",
      price: "Free",
      description: "Basic access to the platform",
      features: ["Community access", "Public content", "Event announcements", "Basic profile"],
      color: "border-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      href: "/signup",
    },
    {
      name: "Pioneer",
      price: "₦2,000",
      period: "monthly",
      description: "Enhanced access with exclusive content",
      features: [
        "All Grassroot features",
        "Early music releases",
        "Exclusive interviews",
        "Discounted merch",
        "Pioneer badge",
      ],
      color: "border-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      href: "/premium",
      popular: true,
    },
    {
      name: "Elder",
      price: "₦5,000",
      period: "monthly",
      description: "Premium access with VIP benefits",
      features: [
        "All Pioneer features",
        "Behind-the-scenes content",
        "Studio session videos",
        "Priority event access",
        "Monthly Erigga coins",
        "Elder badge",
      ],
      color: "border-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      href: "/premium",
    },
    {
      name: "Blood Brotherhood",
      price: "₦10,000",
      period: "monthly",
      description: "Ultimate fan experience",
      features: [
        "All Elder features",
        "Direct messaging with Erigga",
        "Virtual meet & greets",
        "Exclusive merchandise",
        "Blood Brotherhood badge",
        "Voting rights on new content",
      ],
      color: "border-red-500",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      href: "/premium",
    },
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse">
          <div className="h-screen bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <SafeHeroVideoCarousel />

      {/* Rest of the home page content */}
      <section className="py-12 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Explore the Platform</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">Media Vault</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Access exclusive music, videos, and behind-the-scenes content
                </p>
                <Button asChild variant="outline">
                  <Link href="/vault">Explore Vault</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">Community</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Connect with other fans, share content, and join discussions
                </p>
                <Button asChild variant="outline">
                  <Link href="/community">Join Community</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">Chronicles</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Follow Erigga's journey through exclusive stories and updates
                </p>
                <Button asChild variant="outline">
                  <Link href="/chronicles">Read Chronicles</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Platform Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to connect with Erigga and fellow fans in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Link key={index} href={feature.href}>
                <Card className="h-full transition-all duration-300 hover:scale-105 overflow-hidden border border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full mb-4 flex items-center justify-center bg-gradient-to-br",
                        feature.color,
                      )}
                    >
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground flex-grow">{feature.description}</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                      Learn more
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-accent">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Fan Testimonials</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hear what the community has to say about the Erigga fan platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="h-full border border-gray-200 dark:border-gray-800">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="inline-block w-5 h-5 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-lg italic mb-6 flex-grow">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-bold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.tier} Member</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Membership Tiers</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the tier that fits your level of fandom and unlock exclusive perks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {tierPlans.map((plan, index) => (
              <div key={index} className="relative">
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <Card
                  className={cn(
                    "h-full border-2 transition-all duration-300",
                    plan.color,
                    plan.popular ? "transform scale-105" : "",
                  )}
                >
                  <CardContent className={cn("p-6", plan.bgColor)}>
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground">/{plan.period}</span>}
                    </div>
                    <p className="text-muted-foreground mb-6">{plan.description}</p>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <svg
                            className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" asChild>
                      <Link href={plan.href}>{plan.name === "Grassroot" ? "Sign Up Free" : "Subscribe Now"}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Join the Movement?</h2>
          <p className="text-lg max-w-2xl mx-auto mb-8 opacity-90">
            Get access to exclusive content, connect with other fans, and be part of Erigga's journey.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/signup">Join Now</Link>
          </Button>
        </div>
      </section>

      <EriggaRadio />
    </div>
  )
}
