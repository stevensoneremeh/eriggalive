"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Target, Heart, Users, Building, ArrowRight, Shield, Handshake, MessageSquare, Rocket } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
}

const heroImageVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
}

export default function MissionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white overflow-hidden">
      {/* Hero Background with Images */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid grid-cols-2 md:grid-cols-4 h-full">
          <div className="relative">
            <Image src="/images/hero/erigga1.jpeg" alt="Erigga" fill className="object-cover" priority />
          </div>
          <div className="relative">
            <Image src="/images/hero/erigga2.jpeg" alt="Erigga" fill className="object-cover" />
          </div>
          <div className="relative">
            <Image src="/images/hero/erigga3.jpeg" alt="Erigga" fill className="object-cover" />
          </div>
          <div className="relative">
            <Image src="/images/hero/erigga4.jpeg" alt="Erigga" fill className="object-cover" />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-black/90" />
      </div>

      <motion.div
        className="relative z-10 container mx-auto px-4 py-12 md:py-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div className="text-center mb-16 md:mb-24" variants={itemVariants}>
          <motion.div className="inline-block mb-6" variants={heroImageVariants}>
            <Badge className="bg-brand-lime text-black font-bold text-lg px-6 py-2 mb-4">ERIGGA PAPERBOI</Badge>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl lg:text-8xl font-black mb-6 bg-gradient-to-r from-brand-lime via-brand-teal to-white bg-clip-text text-transparent leading-tight"
            variants={itemVariants}
          >
            Purpose Over Hype
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            A movement for the real ones.
          </motion.p>
        </motion.div>

        {/* Main Mission Content */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16" variants={itemVariants}>
          {/* No Be Everybody Go Understand Section */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-brand-lime mb-6">No Be Everybody Go Understand</h2>
              <div className="space-y-4 text-slate-300 leading-relaxed">
                <p>
                  The music industry don turn rat race. Same cycle, same lies — sign contract, lose your soul, make
                  small money, and fade. But not me. I no dey here to please anybody wey no dey from where I from.
                </p>
                <p>I dey here to shake table, build something real for the people wey truly dey believe.</p>
                <p>
                  This platform na for those wey sabi say Erigga na more than music — na message, na movement, na
                  survival. Everything you see here — the music, the videos, the talks — na straight from my head, no
                  manager wey go filter my voice.
                </p>
                <p className="text-brand-teal font-semibold">
                  This na for my true fans — those wey dey with me from "Motivation" to "Problem Nor Dey Finish" — and
                  still believe say we fit build street empire, from Warri to the world.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Real Impact Section */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-brand-teal mb-6">Real Impact. No Gimmicks.</h2>
              <div className="space-y-4 text-slate-300 leading-relaxed">
                <p>
                  I believe say music fit inspire, not just entertain. And now, we go use this platform to give back.
                  Every merch wey you buy, every coin wey you spend go help us support families, boys and girls for the
                  hood wey need help.
                </p>
                <p className="text-brand-lime font-semibold">
                  We go show everything — full transparency. From school packs for kids, to food drives and community
                  upgrades. Together, we go run am.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                  <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">100%</div>
                  <div className="text-sm text-slate-400">Transparency</div>
                </div>
                <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                  <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">Community</div>
                  <div className="text-sm text-slate-400">First</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Code of the Street Members */}
        <motion.div className="mb-16" variants={itemVariants}>
          <Card className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-brand-lime/30 backdrop-blur-sm">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-center text-brand-lime mb-8">
                Code of the Street Members
              </h2>
              <p className="text-xl text-center text-slate-300 mb-8">If you wan join, just know say:</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <motion.div
                  className="flex items-start space-x-4 p-4 bg-slate-700/30 rounded-lg"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Target className="h-8 w-8 text-brand-lime flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-white mb-2">Purpose over hype</h3>
                    <p className="text-slate-300 text-sm">we dey for long term, not trend.</p>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-start space-x-4 p-4 bg-slate-700/30 rounded-lg"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Handshake className="h-8 w-8 text-brand-teal flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-white mb-2">Trust</h3>
                    <p className="text-slate-300 text-sm">what happens in here, stays in here.</p>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-start space-x-4 p-4 bg-slate-700/30 rounded-lg"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <MessageSquare className="h-8 w-8 text-yellow-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-white mb-2">Real talk only</h3>
                    <p className="text-slate-300 text-sm">no fake love, no pretense.</p>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-start space-x-4 p-4 bg-slate-700/30 rounded-lg"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Rocket className="h-8 w-8 text-purple-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-white mb-2">Support</h3>
                    <p className="text-slate-300 text-sm">we lift each other.</p>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-start space-x-4 p-4 bg-slate-700/30 rounded-lg md:col-span-2 lg:col-span-1"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Building className="h-8 w-8 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-white mb-2">Build</h3>
                    <p className="text-slate-300 text-sm">this na brick by brick, not clout.</p>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Featured Images Gallery */}
        <motion.div className="mb-16" variants={itemVariants}>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-8">The Movement</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { src: "/images/hero/erigga2.jpeg", title: "Street Credibility" },
              { src: "/images/hero/erigga3.jpeg", title: "Authentic Voice" },
              { src: "/images/hero/erigga4.jpeg", title: "Community Impact" },
            ].map((image, index) => (
              <motion.div
                key={index}
                className="relative group cursor-pointer"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative h-64 md:h-80 rounded-lg overflow-hidden">
                  <Image
                    src={image.src || "/placeholder.svg"}
                    alt={image.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-lg">{image.title}</h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div className="text-center" variants={itemVariants}>
          <Card className="bg-gradient-to-r from-brand-lime/20 to-brand-teal/20 border-brand-lime/50 backdrop-blur-sm">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                If this message enter your body — you already part of the mission.
              </h2>
              <p className="text-xl text-slate-300 mb-8">Let's get it.</p>
              <div className="text-right">
                <p className="text-brand-lime font-bold text-lg">— Erigga Paperboi</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Link href="/community">
                  <Button
                    size="lg"
                    className="bg-brand-lime text-black hover:bg-brand-lime/90 font-bold px-8 py-3 text-lg"
                  >
                    Join Community
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/vault">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-black font-bold px-8 py-3 text-lg bg-transparent"
                  >
                    Explore Vault
                    <Shield className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
