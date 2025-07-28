"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { Heart, Users, Trophy, Target, Music, Star, ArrowRight, Play, Volume2, Crown } from "lucide-react"

const coreValues = [
  {
    icon: Heart,
    title: "Authenticity",
    description: "Stay true to the streets and real experiences that shape our music and community.",
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-900/20",
  },
  {
    icon: Users,
    title: "Community",
    description: "Building a strong brotherhood that supports and uplifts each member.",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    icon: Trophy,
    title: "Excellence",
    description: "Striving for greatness in every bar, every track, and every performance.",
    color: "text-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
  },
  {
    icon: Target,
    title: "Unity",
    description: "One voice, one mission - bringing the South South sound to the world.",
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-900/20",
  },
]

const achievements = [
  { label: "Community Members", value: 25000, suffix: "+" },
  { label: "Tracks Released", value: 150, suffix: "+" },
  { label: "Live Sessions", value: 500, suffix: "+" },
  { label: "Cities Reached", value: 50, suffix: "+" },
]

const heroImages = [
  "/images/hero/erigga1.jpeg",
  "/images/hero/erigga2.jpeg",
  "/images/hero/erigga3.jpeg",
  "/images/hero/erigga4.jpeg",
]

export default function MissionPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [counters, setCounters] = useState(achievements.map(() => 0))

  // Auto-rotate hero images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Animate counters
  useEffect(() => {
    const animateCounters = () => {
      achievements.forEach((achievement, index) => {
        let start = 0
        const end = achievement.value
        const duration = 2000
        const increment = end / (duration / 16)

        const timer = setInterval(() => {
          start += increment
          if (start >= end) {
            setCounters((prev) => {
              const newCounters = [...prev]
              newCounters[index] = end
              return newCounters
            })
            clearInterval(timer)
          } else {
            setCounters((prev) => {
              const newCounters = [...prev]
              newCounters[index] = Math.floor(start)
              return newCounters
            })
          }
        }, 16)
      })
    }

    const timer = setTimeout(animateCounters, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <Badge variant="outline" className="text-sm font-medium">
                  <Music className="h-4 w-4 mr-2" />
                  South South's Finest
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent leading-tight">
                  Our Mission
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                  To create an authentic platform where real street experiences meet musical excellence, building a
                  community that celebrates the raw talent and stories of South South Nigeria.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/community">
                  <Button size="lg" className="group">
                    Join the Movement
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/radio">
                  <Button variant="outline" size="lg" className="group bg-transparent">
                    <Play className="mr-2 h-4 w-4" />
                    Listen Live
                    <Volume2 className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Hero Images Grid */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-4 h-[500px]">
                {heroImages.map((image, index) => (
                  <motion.div
                    key={index}
                    className={`relative overflow-hidden rounded-2xl ${
                      index === 0 ? "row-span-2" : ""
                    } ${index === currentImageIndex ? "ring-4 ring-primary ring-opacity-50" : ""}`}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`Erigga ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </motion.div>
                ))}
              </div>

              {/* Floating indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Our Core Values</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              These principles guide everything we do, from the music we create to the community we build.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {coreValues.map((value, index) => {
              const Icon = value.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10 }}
                >
                  <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-8 text-center space-y-4">
                      <div
                        className={`w-16 h-16 mx-auto rounded-full ${value.bgColor} flex items-center justify-center`}
                      >
                        <Icon className={`h-8 w-8 ${value.color}`} />
                      </div>
                      <h3 className="text-xl font-semibold">{value.title}</h3>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{value.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-20 px-4 bg-slate-100 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Our Impact</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Numbers that tell our story of growth and community building.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">
                  {counters[index].toLocaleString()}
                  {achievement.suffix}
                </div>
                <div className="text-slate-600 dark:text-slate-300 font-medium">{achievement.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl font-bold">Ready to Join the Brotherhood?</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              Be part of a community that celebrates authentic street music and real stories. Connect with fellow fans,
              access exclusive content, and experience the culture firsthand.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="group">
                  <Star className="mr-2 h-5 w-5" />
                  Start Your Journey
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/premium">
                <Button variant="outline" size="lg">
                  <Crown className="mr-2 h-5 w-5" />
                  Explore Premium
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
