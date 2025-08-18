"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { useTheme } from "@/contexts/theme-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Music, Video, Newspaper, Users, ShoppingBag, Calendar, Play, Radio } from "lucide-react"
import { cn } from "@/lib/utils"
import { SafeHeroVideoCarousel } from "@/components/safe-hero-video-carousel"
import { getOptimizedVideoSources } from "@/utils/video-utils"
import EriggaRadio from "@/components/erigga-radio"

export default function HomePage() {
  const { theme } = useTheme()
  const { isAuthenticated } = useAuth()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const { scrollY } = useScroll()
  const videoSources = getOptimizedVideoSources()
  const primaryVideoUrl =
    videoSources[0]?.src ||
    "/videoshttps://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_87iLY6t51DXvy0yPJ00SYhwlKXWl/K6Q-Lit6vuzvhNfoGXuTFB/public/erigga-hero-video.mp4"

  const heroY = useTransform(scrollY, [0, 500], [0, 150])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])

  // Hero images
  const heroImages = [
    "/images/hero/erigga1.jpeg",
    "/images/hero/erigga2.jpeg",
    "/images/hero/erigga3.jpeg",
    "/images/hero/erigga4.jpeg",
  ]

  // Features data with enhanced descriptions
  const features = [
    {
      title: "Media Vault",
      description: "Access Erigga's complete discography, music videos, and exclusive content.",
      icon: Music,
      href: "/vault",
      gradient: "from-primary to-accent",
    },
    {
      title: "Erigga Chronicles",
      description: "Follow Erigga's journey through animated stories and documentaries.",
      icon: Video,
      href: "/chronicles",
      gradient: "from-accent to-secondary",
    },
    {
      title: "Community",
      description: "Connect with other fans, share content, and participate in discussions.",
      icon: Users,
      href: "/community",
      gradient: "from-secondary to-primary",
    },
    {
      title: "Merch Store",
      description: "Shop exclusive Erigga merchandise and limited edition items.",
      icon: ShoppingBag,
      href: "/merch",
      gradient: "from-primary/80 to-accent/80",
    },
    {
      title: "Events & Tickets",
      description: "Get early access to concert tickets and exclusive events.",
      icon: Calendar,
      href: "/tickets",
      gradient: "from-accent/80 to-secondary/80",
    },
    {
      title: "Premium Tiers",
      description: "Upgrade your experience with exclusive perks and content.",
      icon: Newspaper,
      href: "/premium",
      gradient: "from-secondary/80 to-primary/80",
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
    return null
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Erigga Radio Widget - Only on home page */}
      <EriggaRadio />

      <section className="relative h-[100vh] w-full overflow-hidden">
        {/* Background with parallax effect */}
        <motion.div className="absolute inset-0" style={{ y: heroY }}>
          <SafeHeroVideoCarousel images={heroImages} videoUrl={primaryVideoUrl} className="absolute inset-0" />
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
          {/* Noise texture overlay */}
          <div className="absolute inset-0 noise-texture opacity-30" />
        </motion.div>

        {/* Hero Content with staggered animations */}
        <motion.div className="absolute inset-0 flex items-center justify-center z-10" style={{ opacity: heroOpacity }}>
          <div className="text-center max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.8,
                delay: prefersReducedMotion ? 0 : 0.2,
              }}
              className="glass-card rounded-3xl p-8 md:p-12 backdrop-blur-lg"
            >
              <motion.h1
                className="text-4xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.6,
                  delay: prefersReducedMotion ? 0 : 0.4,
                }}
              >
                Welcome to the Official{" "}
                <span className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
                  Erigga Live
                </span>{" "}
                Platform
              </motion.h1>

              <motion.p
                className="text-xl md:text-2xl text-white/90 mb-8 drop-shadow-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.6,
                  delay: prefersReducedMotion ? 0 : 0.6,
                }}
              >
                Join the community and get exclusive access to music, videos, and events
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.6,
                  delay: prefersReducedMotion ? 0 : 0.8,
                }}
              >
                <Link href="/signup" className="inline-block">
                  <motion.div
                    className="bg-gradient-to-r from-accent to-secondary text-white font-bold rounded-xl py-4 px-8 text-center shadow-2xl border border-white/20"
                    whileHover={
                      prefersReducedMotion
                        ? {}
                        : {
                            scale: 1.05,
                            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                          }
                    }
                    whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    Join Now
                  </motion.div>
                </Link>

                <Link href="/vault" className="inline-block">
                  <motion.div
                    className="glass-card text-white font-bold rounded-xl py-4 px-8 text-center border border-white/30"
                    whileHover={
                      prefersReducedMotion
                        ? {}
                        : {
                            scale: 1.05,
                            backgroundColor: "rgba(255,255,255,0.1)",
                          }
                    }
                    whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    Explore Content
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        <div className="absolute bottom-10 left-10 hidden md:flex space-x-1 opacity-20">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 bg-accent rounded-full equalizer-bar"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </section>

      {isAuthenticated && (
        <motion.section
          className="py-8 bg-gradient-to-r from-primary/10 to-accent/10 border-y border-border/50"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
        >
          <div className="container mx-auto px-4">
            <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center">
                    <Radio className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full pulse-glow" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Now Playing</h3>
                  <p className="text-muted-foreground">Erigga Radio - 24/7 Street Beats</p>
                </div>
                <div className="hidden md:flex space-x-1 ml-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-1 bg-accent rounded-full equalizer-bar" />
                  ))}
                </div>
              </div>
              <Link href="/radio">
                <Button className="bg-gradient-to-r from-accent to-secondary hover:from-accent/90 hover:to-secondary/90">
                  <Play className="w-4 h-4 mr-2" />
                  Listen Live
                </Button>
              </Link>
            </div>
          </div>
        </motion.section>
      )}

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
                  Connect with others, share content, and join discussions
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
      <section className="py-20 relative overflow-hidden">
        {/* Background gradient mesh */}
        <div className="absolute inset-0 gradient-mesh opacity-5" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Platform Features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Everything you need to connect with Erigga and fellow fans in one place.
            </p>
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
                    <span className="bg-brand-lime text-brand-teal dark:bg-white dark:text-black px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <Card
                  className={cn(
                    "h-full border-2 transition-all duration-300",
                    plan.color,
                    plan.popular ? "transform scale-105" : "",
                    theme === "dark" ? "harkonnen-card" : "",
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
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            ></path>
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={cn(
                        "w-full",
                        plan.name === "Grassroot"
                          ? "bg-grassroot-primary text-white hover:bg-opacity-90"
                          : plan.name === "Pioneer"
                            ? "bg-pioneer-primary text-white hover:bg-opacity-90"
                            : plan.name === "Elder"
                              ? "bg-elder-primary text-white hover:bg-opacity-90"
                              : "bg-blood-primary text-white hover:bg-opacity-90",
                      )}
                      asChild
                    >
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
      </section>
    </div>
  )
}

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
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.6,
        delay: prefersReducedMotion ? 0 : index * 0.1,
      }}
    >
      <Link href={feature.href}>
        <motion.div
          className="glass-card rounded-2xl p-8 h-full group cursor-pointer overflow-hidden relative"
          whileHover={
            prefersReducedMotion
              ? {}
              : {
                  y: -10,
                  transition: { duration: 0.3 },
                }
          }
          whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
        >
          {/* Gradient background on hover */}
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300",
              feature.gradient,
            )}
          />

          <div className="relative z-10">
            <motion.div
              className={cn(
                "w-16 h-16 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br shadow-lg",
                feature.gradient,
              )}
              whileHover={
                prefersReducedMotion
                  ? {}
                  : {
                      rotate: 5,
                      scale: 1.1,
                    }
              }
              transition={{ duration: 0.2 }}
            >
              <feature.icon className="h-8 w-8 text-white" />
            </motion.div>

            <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{feature.title}</h3>

            <p className="text-muted-foreground leading-relaxed mb-6">{feature.description}</p>

            <motion.div
              className="flex items-center text-primary font-medium group-hover:text-accent transition-colors"
              whileHover={prefersReducedMotion ? {} : { x: 5 }}
              transition={{ duration: 0.2 }}
            >
              Learn more
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}
