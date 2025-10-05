"use client"

<<<<<<< HEAD
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Play, Users, Music, Star, ArrowRight, Calendar, MessageSquare, Crown, Coins } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export default function HomePage() {
  const { isAuthenticated, profile, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
=======
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { useTheme } from "@/contexts/theme-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Music, Video, Users, ShoppingBag, Calendar, Play, Star, ArrowRight, Crown, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { SafeHeroVideoCarousel } from "@/components/safe-hero-video-carousel"
import { getOptimizedVideoSources } from "@/utils/video-utils"
import { ShoutOutDisplay } from "@/components/shout-out-display"

export default function HomePage() {
  const { theme } = useTheme()
  const { isAuthenticated } = useAuth()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const { scrollY } = useScroll()
  const videoSources = getOptimizedVideoSources()

  const primaryVideoUrl = videoSources[0]?.src || "/videos/erigga-hero-video.mp4"

  const heroY = useSpring(useTransform(scrollY, [0, 500], [0, 150]), { stiffness: 100, damping: 30 })
  const heroOpacity = useSpring(useTransform(scrollY, [0, 300], [1, 0]), { stiffness: 100, damping: 30 })
  const heroScale = useSpring(useTransform(scrollY, [0, 300], [1, 1.1]), { stiffness: 100, damping: 30 })

  // Hero images
  const heroImages = [
    "/images/hero/erigga-aitiv-poster.jpeg",
    "/images/hero/erigga-vintage-monitors.jpeg",
    "/images/hero/erigga-metallic-mask.jpeg",
    "/images/hero/erigga-denim-hoodie.jpeg",
    "/images/hero/erigga-metallic-chain.jpeg",
  ]

  const features = [
    {
      title: "Media Vault",
      description: "Access Erigga's complete discography, music videos, and exclusive behind-the-scenes content.",
      icon: Music,
      href: "/vault",
      gradient: "from-cyan-500 to-blue-600",
      delay: 0,
    },
    {
      title: "Erigga Chronicles",
      description: "Follow Erigga's journey through animated stories, documentaries, and personal insights.",
      icon: Video,
      href: "/chronicles",
      gradient: "from-purple-500 to-pink-600",
      delay: 0.1,
    },
    {
      title: "Community Hub",
      description: "Connect with fellow fans, share content, and participate in exclusive discussions.",
      icon: Users,
      href: "/community",
      gradient: "from-emerald-500 to-teal-600",
      delay: 0.2,
    },
    {
      title: "Merch Store",
      description: "Shop exclusive Erigga merchandise, limited editions, and fan-designed items.",
      icon: ShoppingBag,
      href: "/merch",
      gradient: "from-orange-500 to-red-600",
      delay: 0.3,
    },
    {
      title: "Live Events",
      description: "Get early access to concert tickets, meet & greets, and exclusive events.",
      icon: Calendar,
      href: "/tickets",
      gradient: "from-indigo-500 to-purple-600",
      delay: 0.4,
    },
    {
      title: "Premium Access",
      description: "Upgrade your experience with exclusive perks, content, and direct artist access.",
      icon: Star,
      href: "/premium",
      gradient: "from-amber-500 to-yellow-600",
      delay: 0.5,
    },
  ]

  // Testimonials data
  const testimonials = [
    {
      quote: "Erigga's platform connects me directly with real fans. The community here is authentic.",
      author: "WarriKing23",
      tier: "Enterprise",
    },
    {
      quote: "The exclusive content in the vault is worth every coin. Can't get this anywhere else!",
      author: "PaperBoi99",
      tier: "Pro",
    },
    {
      quote: "Chronicles series tells Erigga's story in a way I've never seen before. Pure street wisdom.",
      author: "LagosHustler",
      tier: "Pro",
    },
  ]

  const tierPlans = [
    {
      name: "Free",
      price: "Free",
      description: "Start your journey with basic platform access",
      features: ["Community access", "Public content", "Event announcements", "Basic profile"],
      color: "border-gray-200 dark:border-gray-700",
      bgColor: "bg-gray-50/50 dark:bg-gray-900/20",
      textColor: "text-gray-600 dark:text-gray-400",
      href: "/signup",
      icon: Star,
    },
    {
      name: "Pro",
      price: "₦10,000",
      period: "monthly",
      description: "Enhanced access with exclusive content and perks",
      features: [
        "All Free features",
        "Early music releases",
        "Exclusive interviews",
        "15% discount on merchandise",
        "Pro community badge",
        "Premium vault access",
        "Monthly exclusive freestyles",
        "Advanced community features",
      ],
      color: "border-blue-200 dark:border-blue-800",
      bgColor: "bg-blue-50/50 dark:bg-blue-950/20",
      textColor: "text-blue-600 dark:text-blue-400",
      href: "/premium",
      popular: true,
      icon: Crown,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "annually",
      description: "Ultimate fan experience with direct artist access",
      features: [
        "All Pro features",
        "VIP access to all events",
        "30% discount on all purchases",
        "Backstage access at events",
        "Direct contact with Erigga",
        "Custom Enterprise 'E' badge",
        "Full vault access",
        "Quarterly private sessions",
        "Input on upcoming releases",
        "Limited edition merchandise",
        "Priority customer support",
        "Exclusive meet & greet opportunities",
      ],
      color: "border-purple-200 dark:border-purple-800",
      bgColor: "bg-purple-50/50 dark:bg-purple-950/20",
      textColor: "text-purple-600 dark:text-purple-400",
      href: "/premium",
      icon: Zap,
    },
  ]

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  // Auto-advance carousel
  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [heroImages.length])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
>>>>>>> new
      </div>
    )
  }

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to Erigga Live
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            The official fan platform for Erigga - Connect with the community, access exclusive content, and experience
            Nigerian hip-hop like never before.
          </p>

          {isAuthenticated ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  <Play className="mr-2 h-5 w-5" />
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/community">
                <Button size="lg" variant="outline">
                  <Users className="mr-2 h-5 w-5" />
                  Join Community
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  <Star className="mr-2 h-5 w-5" />
                  Join the Community
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        >
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                <Music className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Exclusive Content</CardTitle>
              <CardDescription>
                Access unreleased tracks, behind-the-scenes footage, and exclusive interviews
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Community</CardTitle>
              <CardDescription>
                Connect with fellow fans, share your thoughts, and participate in discussions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mb-4">
                <Coins className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle>Erigga Coins</CardTitle>
              <CardDescription>
                Earn coins through engagement and use them for exclusive content and merchandise
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Live Events</CardTitle>
              <CardDescription>
                Get early access to concert tickets and exclusive meet & greet opportunities
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Direct Chat</CardTitle>
              <CardDescription>
                Participate in live chats and Q&A sessions with Erigga and the community
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                <Crown className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Tier System</CardTitle>
              <CardDescription>Progress through tiers to unlock exclusive benefits and premium content</CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Join the Growing Community</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">10K+</div>
              <div className="text-gray-600 dark:text-gray-300">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600 dark:text-gray-300">Exclusive Tracks</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">50+</div>
              <div className="text-gray-600 dark:text-gray-300">Live Events</div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center"
          >
            <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Ready to Join?</h3>
                <p className="mb-6 opacity-90">
                  Start your journey with Erigga Live today and become part of the culture
                </p>
                <Link href="/signup">
                  <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                    Get Started Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
=======
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <ShoutOutDisplay position="top" />

      <section className="relative h-[100vh] w-full overflow-hidden">
        {/* Background with enhanced parallax effect */}
        <motion.div className="absolute inset-0" style={{ y: heroY, scale: heroScale }}>
          <SafeHeroVideoCarousel
            images={heroImages}
            videoUrl={primaryVideoUrl}
            className="absolute inset-0 object-cover w-full h-full"
          />
          {/* Enhanced gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
          {/* Animated noise texture */}
          <motion.div
            className="absolute inset-0 noise-texture opacity-20"
            animate={{ opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Enhanced hero content with better typography and animations */}
        <motion.div className="absolute inset-0 flex items-center justify-center z-10" style={{ opacity: heroOpacity }}>
          <div className="text-center max-w-6xl px-4">
            <motion.div
              className="glass-card rounded-3xl p-8 md:p-16 backdrop-blur-xl border border-white/20 shadow-2xl"
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 1.2,
                delay: prefersReducedMotion ? 0 : 0.3,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <motion.h1
                className="text-5xl md:text-8xl font-black text-white mb-8 drop-shadow-2xl leading-tight"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.8,
                  delay: prefersReducedMotion ? 0 : 0.6,
                }}
              >
                Welcome to{" "}
                <motion.span
                  className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                  style={{ backgroundSize: "200% 200%" }}
                >
                  Erigga Live
                </motion.span>
              </motion.h1>

              <motion.p
                className="text-xl md:text-3xl text-white/95 mb-10 drop-shadow-lg font-light leading-relaxed"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.8,
                  delay: prefersReducedMotion ? 0 : 0.8,
                }}
              >
                The official platform for exclusive music, videos, events, and community
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-6 justify-center"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.8,
                  delay: prefersReducedMotion ? 0 : 1,
                }}
              >
                <Link href="/signup" className="inline-block">
                  <motion.div
                    className="group relative bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl py-5 px-10 text-lg shadow-2xl border border-white/30 overflow-hidden"
                    whileHover={
                      prefersReducedMotion
                        ? {}
                        : {
                            scale: 1.05,
                            boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
                          }
                    }
                    whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                    <span className="relative z-10 flex items-center">
                      Join the Movement
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </motion.div>
                </Link>

                <Link href="/vault" className="inline-block">
                  <motion.div
                    className="group glass-card text-white font-bold rounded-2xl py-5 px-10 text-lg border border-white/40 backdrop-blur-xl"
                    whileHover={
                      prefersReducedMotion
                        ? {}
                        : {
                            scale: 1.05,
                            backgroundColor: "rgba(255,255,255,0.15)",
                          }
                    }
                    whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="flex items-center">
                      Explore Content
                      <Play className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                    </span>
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-10 left-10 hidden md:flex space-x-2 opacity-30"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 0.3, x: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-gradient-to-t from-cyan-400 to-blue-600 rounded-full"
              animate={{
                height: [20, 40, 60, 30, 50, 25, 45],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.1,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </section>

      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-background to-muted/20">
        {/* Animated background elements */}
        <motion.div
          className="absolute inset-0 gradient-mesh opacity-5"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8 }}
          >
            <motion.h2
              className="text-5xl md:text-6xl font-black mb-8 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
              style={{ backgroundSize: "200% 200%" }}
            >
              Platform Features
            </motion.h2>
            <motion.p
              className="text-muted-foreground max-w-3xl mx-auto text-xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Everything you need to connect with Erigga and fellow fans in one comprehensive platform.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} prefersReducedMotion={prefersReducedMotion} />
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
              <Card
                key={index}
                className={cn("h-full", theme === "dark" ? "harkonnen-card" : "border border-gray-200")}
              >
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

      <section className="py-24 bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Membership Tiers
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
              Choose the tier that matches your level of fandom and unlock exclusive perks and content.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {tierPlans.map((plan, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.6,
                  delay: prefersReducedMotion ? 0 : index * 0.1,
                }}
              >
                {plan.popular && (
                  <motion.div
                    className="absolute -top-4 left-0 right-0 flex justify-center z-10"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                  >
                    <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      Most Popular
                    </span>
                  </motion.div>
                )}
                <motion.div
                  whileHover={{
                    y: prefersReducedMotion ? 0 : -8,
                    scale: prefersReducedMotion ? 1 : 1.02,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    className={cn(
                      "h-full border-2 transition-all duration-300 backdrop-blur-sm",
                      plan.color,
                      plan.popular ? "shadow-2xl" : "shadow-lg",
                    )}
                  >
                    <CardContent className={cn("p-8", plan.bgColor)}>
                      <div className="text-center mb-6">
                        <motion.div
                          className={cn(
                            "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
                            plan.textColor.replace("text-", "bg-").replace("dark:text-", "dark:bg-"),
                          )}
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <plan.icon className="h-8 w-8 text-white" />
                        </motion.div>
                        <h3 className={cn("text-2xl font-bold mb-2", plan.textColor)}>{plan.name}</h3>
                        <div className="mb-4">
                          <span className="text-4xl font-black">{plan.price}</span>
                          {plan.period && <span className="text-muted-foreground text-lg">/{plan.period}</span>}
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{plan.description}</p>
                      </div>

                      <ul className="space-y-3 mb-8">
                        {plan.features.map((feature, i) => (
                          <motion.li
                            key={i}
                            className="flex items-start"
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 * i }}
                          >
                            <div
                              className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-0.5",
                                plan.textColor.replace("text-", "bg-").replace("dark:text-", "dark:bg-"),
                              )}
                            >
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <span className="text-sm leading-relaxed">{feature}</span>
                          </motion.li>
                        ))}
                      </ul>

                      <Link href={plan.href} className="block">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            className={cn(
                              "w-full font-bold py-3 rounded-xl shadow-lg transition-all duration-300",
                              plan.textColor.replace("text-", "bg-").replace("dark:text-", "dark:bg-"),
                              "text-white hover:shadow-xl",
                            )}
                          >
                            {plan.name === "Free" ? "Start Free" : "Subscribe Now"}
                          </Button>
                        </motion.div>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-teal dark:bg-harkonnen-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Join the Movement?</h2>
          <p className="text-lg max-w-2xl mx-auto mb-8 text-white/80">
            Get access to exclusive content, connect with other fans, and be part of Erigga's journey.
          </p>
          <Link href="/signup" className="inline-block">
            <div
              className={cn(
                "transition-all duration-300 font-bold rounded-lg py-3 px-8 text-center shadow-lg",
                "transform hover:scale-105 hover:shadow-xl",
                theme === "dark"
                  ? "bg-white text-harkonnen-black hover:bg-gray-200"
                  : "bg-brand-lime text-brand-teal hover:bg-brand-lime-dark",
              )}
            >
              Join Now
            </div>
          </Link>
        </div>
>>>>>>> new
      </section>
    </div>
  )
}
<<<<<<< HEAD
=======

function FeatureCard({
  feature,
  index,
  prefersReducedMotion,
}: {
  feature: any
  index: number
  prefersReducedMotion: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.8,
        delay: prefersReducedMotion ? 0 : feature.delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <Link href={feature.href}>
        <motion.div
          className="glass-card rounded-3xl p-10 h-full group cursor-pointer overflow-hidden relative border border-white/10 shadow-xl backdrop-blur-xl"
          whileHover={
            prefersReducedMotion
              ? {}
              : {
                  y: -12,
                  scale: 1.02,
                  transition: { duration: 0.3, ease: "easeOut" },
                }
          }
          whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
        >
          {/* Animated gradient background */}
          <motion.div
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500",
              feature.gradient,
            )}
            whileHover={{ opacity: 0.1 }}
          />

          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full"
                animate={{
                  x: [0, 100, 0],
                  y: [0, -100, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 1.5,
                  ease: "easeInOut",
                }}
                style={{
                  left: `${20 + i * 30}%`,
                  top: `${80 - i * 20}%`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10">
            <motion.div
              className={cn(
                "w-20 h-20 rounded-3xl mb-8 flex items-center justify-center bg-gradient-to-br shadow-xl",
                feature.gradient,
              )}
              whileHover={
                prefersReducedMotion
                  ? {}
                  : {
                      rotate: 10,
                      scale: 1.1,
                    }
              }
              transition={{ duration: 0.3 }}
            >
              <feature.icon className="h-10 w-10 text-white drop-shadow-lg" />
            </motion.div>

            <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors duration-300">
              {feature.title}
            </h3>

            <p className="text-muted-foreground leading-relaxed mb-8 text-base">{feature.description}</p>

            <motion.div
              className="flex items-center text-primary font-semibold group-hover:text-accent transition-colors duration-300"
              whileHover={prefersReducedMotion ? {} : { x: 8 }}
              transition={{ duration: 0.2 }}
            >
              Explore feature
              <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                <ArrowRight className="h-5 w-5 ml-2" />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}
>>>>>>> new
