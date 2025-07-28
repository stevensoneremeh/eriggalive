"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, Users, Crown, Music, Heart, Star, Award, Mic, Globe, ArrowRight, Play, Quote } from "lucide-react"

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const CORE_VALUES = [
  {
    icon: Heart,
    title: "Authenticity",
    description: "Stay true to the streets, stay true to the culture",
    color: "from-red-500 to-pink-500",
  },
  {
    icon: Users,
    title: "Community",
    description: "Building bridges across the Niger Delta and beyond",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Star,
    title: "Excellence",
    description: "Pushing boundaries in every verse, every beat",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: Globe,
    title: "Unity",
    description: "One voice, one movement, one family",
    color: "from-green-500 to-emerald-500",
  },
]

const ACHIEVEMENTS = [
  { icon: Award, label: "Multiple Hit Singles", count: "50+" },
  { icon: Users, label: "Active Community Members", count: "100K+" },
  { icon: Music, label: "Albums Released", count: "8+" },
  { icon: Mic, label: "Live Performances", count: "200+" },
]

export default function MissionPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 py-20">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="mb-8">
              <Badge className="mb-4 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <Target className="h-3 w-3 mr-1" />
                Our Mission
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 bg-clip-text text-transparent">
                The Erigga Movement
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                From the streets of Warri to the world stage, we're building more than music – we're building a legacy
                that represents the authentic voice of the Niger Delta.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[
                "/images/hero/erigga1.jpeg",
                "/images/hero/erigga2.jpeg",
                "/images/hero/erigga3.jpeg",
                "/images/hero/erigga4.jpeg",
              ].map((src, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                  <Image
                    src={src || "/placeholder.svg"}
                    alt={`Erigga ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Link href="/community">
                  Join the Community
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/vault">
                  <Play className="mr-2 h-4 w-4" />
                  Explore Content
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Our Mission</h2>
              <div className="relative">
                <Quote className="absolute -top-4 -left-4 h-8 w-8 text-primary/20" />
                <blockquote className="text-xl md:text-2xl italic text-muted-foreground leading-relaxed">
                  "To amplify the authentic voice of the streets, connect communities across the Niger Delta, and create
                  a platform where real stories meet real people. We're not just making music – we're documenting
                  history, one bar at a time."
                </blockquote>
                <Quote className="absolute -bottom-4 -right-4 h-8 w-8 text-primary/20 rotate-180" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Core Values</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                The principles that guide everything we do, from the studio to the streets
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {CORE_VALUES.map((value, index) => {
                const Icon = value.icon
                return (
                  <motion.div key={index} variants={fadeInUp}>
                    <Card className="h-full border-0 bg-gradient-to-br from-background to-muted/20 hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <div
                          className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${value.color} flex items-center justify-center`}
                        >
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                        <p className="text-muted-foreground">{value.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">By the Numbers</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                The impact we've made together as a community
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {ACHIEVEMENTS.map((achievement, index) => {
                const Icon = achievement.icon
                return (
                  <motion.div key={index} variants={fadeInUp}>
                    <Card className="text-center border-0 bg-gradient-to-br from-background to-muted/20">
                      <CardContent className="p-6">
                        <Icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                        <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{achievement.count}</div>
                        <p className="text-sm text-muted-foreground">{achievement.label}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Join the Movement?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Be part of something bigger. Connect with fans, access exclusive content, and help shape the future of
              authentic African hip-hop.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Link href="/signup">
                  <Users className="mr-2 h-4 w-4" />
                  Join Community
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/premium">
                  <Crown className="mr-2 h-4 w-4" />
                  Go Premium
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
