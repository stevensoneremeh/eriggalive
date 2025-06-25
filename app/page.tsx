"use client"

import { Suspense } from "react"
import { useState, useEffect } from "react"
import { useTheme } from "@/contexts/theme-context"
import { Music, Video, Newspaper, Users, ShoppingBag, Calendar } from "lucide-react"
import { getOptimizedVideoSources } from "@/utils/video-utils"
import { EriggaRadio } from "@/components/erigga-radio"
import { HeroVideoCarousel } from "@/components/hero-video-carousel"
import { Navigation } from "@/components/navigation"

export default function HomePage() {
  const { theme } = useTheme()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [mounted, setMounted] = useState(false)
  const videoSources = getOptimizedVideoSources()
  const primaryVideoUrl = videoSources[0]?.src || "/videos/erigga-hero-video.mp4"

  // Hero images
  const heroImages = [
    "/images/hero/erigga1.jpeg",
    "/images/hero/erigga2.jpeg",
    "/images/hero/erigga3.jpeg",
    "/images/hero/erigga4.jpeg",
  ]

  // Features data
  const features = [
    {
      title: "Media Vault",
      description: "Access Erigga's complete discography, music videos, and exclusive content.",
      icon: Music,
      href: "/vault",
      color: "from-brand-lime to-brand-teal dark:from-white dark:to-harkonnen-gray",
    },
    {
      title: "Erigga Chronicles",
      description: "Follow Erigga's journey through animated stories and documentaries.",
      icon: Video,
      href: "/chronicles",
      color: "from-brand-teal to-brand-lime-dark dark:from-harkonnen-gray dark:to-white",
    },
    {
      title: "Community",
      description: "Connect with other fans, share content, and participate in discussions.",
      icon: Users,
      href: "/community",
      color: "from-brand-lime-dark to-brand-teal-light dark:from-white dark:to-harkonnen-light-gray",
    },
    {
      title: "Merch Store",
      description: "Shop exclusive Erigga merchandise and limited edition items.",
      icon: ShoppingBag,
      href: "/merch",
      color: "from-brand-teal-light to-brand-lime dark:from-harkonnen-light-gray dark:to-white",
    },
    {
      title: "Events & Tickets",
      description: "Get early access to concert tickets and exclusive events.",
      icon: Calendar,
      href: "/tickets",
      color: "from-brand-lime to-brand-teal-dark dark:from-white dark:to-harkonnen-dark-gray",
    },
    {
      title: "Premium Tiers",
      description: "Upgrade your experience with exclusive perks and content.",
      icon: Newspaper,
      href: "/premium",
      color: "from-brand-teal-dark to-brand-lime-light dark:from-harkonnen-dark-gray dark:to-white",
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
      color: "border-grassroot-primary dark:border-grassroot-primary",
      bgColor: "bg-grassroot-secondary/20 dark:bg-grassroot-secondary",
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
      color: "border-pioneer-primary dark:border-pioneer-primary",
      bgColor: "bg-pioneer-secondary/20 dark:bg-pioneer-secondary",
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
      color: "border-elder-primary dark:border-elder-primary",
      bgColor: "bg-elder-secondary/20 dark:bg-elder-secondary",
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
      color: "border-blood-primary dark:border-blood-primary",
      bgColor: "bg-blood-secondary/20 dark:bg-blood-secondary",
      href: "/premium",
    },
  ]

  // Auto-advance carousel
  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [heroImages.length])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="relative">
        <Suspense fallback={<div className="h-screen bg-black animate-pulse" />}>
          <HeroVideoCarousel />
        </Suspense>

        {/* Additional homepage content can go here */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Welcome to Erigga Live</h2>
            <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
              Experience the authentic sound of Nigerian street music with exclusive content, community interactions,
              and the latest from the Paper Boi himself.
            </p>
          </div>
        </section>
      </main>

      {/* Erigga Radio - Only on homepage */}
      <EriggaRadio />
    </div>
  )
}
