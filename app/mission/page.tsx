"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, Users, Heart, Music, Mic, Star, ArrowRight, Quote, Play, Award, Globe, Zap } from "lucide-react"

const missionPoints = [
  {
    icon: Music,
    title: "Authentic Street Music",
    description: "Delivering raw, unfiltered music that speaks to the streets and resonates with real experiences.",
  },
  {
    icon: Users,
    title: "Community Building",
    description: "Creating a platform where fans connect, share experiences, and build lasting relationships.",
  },
  {
    icon: Heart,
    title: "Cultural Impact",
    description: "Preserving and promoting Nigerian street culture through music and storytelling.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Taking Nigerian street music to the world while staying true to our roots.",
  },
]

const achievements = [
  { number: "500K+", label: "Active Fans" },
  { number: "50+", label: "Hit Songs" },
  { number: "10+", label: "Years Active" },
  { number: "100+", label: "Collaborations" },
]

const coreValues = [
  {
    title: "Authenticity",
    description: "We stay true to our roots and never compromise on our street credibility.",
    icon: Star,
  },
  {
    title: "Unity",
    description: "We bring people together through music, regardless of their background.",
    icon: Users,
  },
  {
    title: "Excellence",
    description: "We strive for the highest quality in everything we create and deliver.",
    icon: Award,
  },
  {
    title: "Innovation",
    description: "We constantly evolve and push boundaries while respecting tradition.",
    icon: Zap,
  },
]

export default function MissionPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                  <Target className="h-3 w-3 mr-1" />
                  Our Mission
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  <span className="text-gradient">Erigga's</span>
                  <br />
                  <span className="text-foreground">Mission</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  To create authentic street music that connects with the people, builds community, and preserves the
                  culture of Nigerian street life.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/community">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  >
                    Join the Movement
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/vault">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Explore Music
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                    <Image
                      src="/images/hero/erigga1.jpeg"
                      alt="Erigga performing"
                      width={300}
                      height={400}
                      className="object-cover w-full h-64 hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                    <Image
                      src="/images/hero/erigga3.jpeg"
                      alt="Erigga in studio"
                      width={300}
                      height={300}
                      className="object-cover w-full h-48 hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                    <Image
                      src="/images/hero/erigga2.jpeg"
                      alt="Erigga with fans"
                      width={300}
                      height={300}
                      className="object-cover w-full h-48 hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                    <Image
                      src="/images/hero/erigga4.jpeg"
                      alt="Erigga lifestyle"
                      width={300}
                      height={400}
                      className="object-cover w-full h-64 hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center space-y-8"
          >
            <Quote className="h-12 w-12 text-primary mx-auto" />
            <blockquote className="text-2xl md:text-3xl font-medium leading-relaxed text-foreground">
              "My mission is to be the voice of the streets, to tell our stories through music, and to create a
              community where everyone feels heard and valued. Music is not just entertainment—it's a movement, it's
              culture, it's life."
            </blockquote>
            <div className="flex items-center justify-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                <Mic className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-lg">Erigga</p>
                <p className="text-muted-foreground">Paper Boi</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Points */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold">What Drives Us</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our mission is built on four core pillars that guide everything we do
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {missionPoints.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center mx-auto">
                      <point.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">{point.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{point.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold">Our Impact</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Numbers that tell the story of our journey and community
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center space-y-2"
              >
                <div className="text-4xl md:text-5xl font-bold text-gradient">{achievement.number}</div>
                <div className="text-muted-foreground font-medium">{achievement.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold">Our Core Values</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The principles that guide our music, community, and everything we stand for
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {coreValues.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                        <value.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-semibold">{value.title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-lg">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center space-y-8 max-w-4xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Join the Movement?</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Be part of something bigger. Connect with fellow fans, access exclusive content, and experience the
              authentic street culture that Erigga represents.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8"
                >
                  Join the Community
                  <Users className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/premium">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 bg-transparent"
                >
                  Explore Premium
                  <Star className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
