"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Heart, Users, Music, Star, Target, Zap, Globe, Award, TrendingUp, Play, ArrowRight } from "lucide-react"

const heroImages = [
  "/images/hero/erigga1.jpeg",
  "/images/hero/erigga2.jpeg",
  "/images/hero/erigga3.jpeg",
  "/images/hero/erigga4.jpeg",
]

const coreValues = [
  {
    icon: Heart,
    title: "Authenticity",
    description: "Stay true to the streets and real experiences that shape our music and community.",
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/20",
  },
  {
    icon: Users,
    title: "Community",
    description: "Building bridges between fans, creating lasting connections through shared passion.",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    icon: Star,
    title: "Excellence",
    description: "Delivering quality music and experiences that elevate the culture and inspire growth.",
    color: "text-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
  },
  {
    icon: Globe,
    title: "Unity",
    description: "Bringing people together across boundaries through the universal language of music.",
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
]

const achievements = [
  { label: "Community Members", value: 25000, suffix: "+" },
  { label: "Songs Released", value: 150, suffix: "+" },
  { label: "Live Performances", value: 200, suffix: "+" },
  { label: "Years Active", value: 15, suffix: "" },
]

export default function MissionPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [animatedValues, setAnimatedValues] = useState(achievements.map(() => 0))

  // Auto-rotate hero images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  // Animate achievement counters
  useEffect(() => {
    const animateCounters = () => {
      achievements.forEach((achievement, index) => {
        let current = 0
        const increment = achievement.value / 50
        const timer = setInterval(() => {
          current += increment
          if (current >= achievement.value) {
            current = achievement.value
            clearInterval(timer)
          }
          setAnimatedValues((prev) => {
            const newValues = [...prev]
            newValues[index] = Math.floor(current)
            return newValues
          })
        }, 30)
      })
    }

    const timer = setTimeout(animateCounters, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 z-10" />

        {/* Background Images */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <div
              key={image}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={image || "/placeholder.svg"}
                alt={`Erigga ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl text-white">
            <Badge className="mb-4 bg-primary/20 text-primary-foreground border-primary/30">
              <Target className="h-4 w-4 mr-2" />
              Our Mission
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Elevating Street
              <span className="text-primary block">Culture</span>
            </h1>
            <p className="text-xl mb-8 text-gray-200 leading-relaxed">
              Bridging the gap between authentic street experiences and mainstream success, while building a community
              that celebrates real stories and genuine connections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="group">
                <Link href="/community">
                  Join Our Community
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Link href="/radio">
                  <Play className="mr-2 h-5 w-5" />
                  Listen Now
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Image Indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentImageIndex ? "bg-white scale-110" : "bg-white/50 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">
              <Zap className="h-4 w-4 mr-2" />
              Core Values
            </Badge>
            <h2 className="text-4xl font-bold mb-6">What Drives Us</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our mission is built on four fundamental pillars that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {coreValues.map((value, index) => (
              <Card
                key={value.title}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-16 h-16 mx-auto rounded-full ${value.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <value.icon className={`h-8 w-8 ${value.color}`} />
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">
              <Award className="h-4 w-4 mr-2" />
              Our Impact
            </Badge>
            <h2 className="text-4xl font-bold mb-6">By The Numbers</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The measurable impact of our mission in building community and culture
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <Card key={achievement.label} className="text-center p-8 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">
                    {animatedValues[index].toLocaleString()}
                    {achievement.suffix}
                  </div>
                  <div className="text-muted-foreground font-medium">{achievement.label}</div>
                  <Progress value={(animatedValues[index] / achievement.value) * 100} className="mt-4 h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4">
                <TrendingUp className="h-4 w-4 mr-2" />
                Our Vision
              </Badge>
              <h2 className="text-4xl font-bold mb-6">The Future We're Building</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-6">Empowering Authentic Voices</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    We envision a world where authentic street culture is not just heard, but celebrated and elevated to
                    its rightful place in mainstream consciousness.
                  </p>
                  <p>
                    Through music, community building, and digital innovation, we're creating platforms that amplify
                    real stories and connect people across cultural and geographical boundaries.
                  </p>
                  <p>
                    Our mission extends beyond entertainment – we're building a movement that empowers artists, engages
                    communities, and preserves the essence of street culture for future generations.
                  </p>
                </div>
              </div>

              <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-0">
                  <Music className="h-12 w-12 text-primary mb-6" />
                  <h4 className="text-xl font-bold mb-4">Join The Movement</h4>
                  <p className="text-muted-foreground mb-6">
                    Be part of a community that values authenticity, celebrates diversity, and supports the growth of
                    street culture worldwide.
                  </p>
                  <div className="space-y-3">
                    <Button asChild className="w-full">
                      <Link href="/signup">
                        <Users className="mr-2 h-4 w-4" />
                        Join Community
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full bg-transparent">
                      <Link href="/premium">
                        <Star className="mr-2 h-4 w-4" />
                        Go Premium
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
