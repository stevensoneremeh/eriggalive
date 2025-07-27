"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Target, Users, MessageCircle, Rocket, Building } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function MissionPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.15,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  }

  const slideInVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  }

  const streetCodeItems = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "Purpose over hype",
      description: "we dey for long term, not trend.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Trust",
      description: "what happens in here, stays in here.",
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Real talk only",
      description: "no fake love, no pretense.",
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: "Support",
      description: "we lift each other.",
    },
    {
      icon: <Building className="w-6 h-6" />,
      title: "Build",
      description: "this na brick by brick, not clout.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Hero Background with Multiple Images */}
      <div className="absolute inset-0">
        <div className="grid grid-cols-2 md:grid-cols-4 h-full opacity-10">
          <img src="/images/hero/erigga1.jpeg" alt="" className="w-full h-full object-cover" />
          <img src="/images/hero/erigga2.jpeg" alt="" className="w-full h-full object-cover" />
          <img src="/images/hero/erigga3.jpeg" alt="" className="w-full h-full object-cover" />
          <img src="/images/hero/erigga4.jpeg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />
      </div>

      {/* Gradient Overlays */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-brand-lime/5 via-transparent to-brand-teal/5" />

      <motion.div
        className="container mx-auto px-4 py-8 md:py-16 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Back Navigation */}
        <motion.div variants={itemVariants} className="mb-8">
          <Button
            variant="ghost"
            asChild
            className="text-gray-300 hover:text-brand-lime transition-colors duration-300 group"
          >
            <Link href="/" className="inline-flex items-center gap-2">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">Back to Home</span>
            </Link>
          </Button>
        </motion.div>

        {/* Header Section */}
        <motion.div className="text-center mb-12 md:mb-16" variants={itemVariants}>
          <motion.div
            className="inline-block mb-6"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Badge
              variant="outline"
              className="text-brand-lime border-brand-lime/50 bg-brand-lime/10 px-4 md:px-6 py-2 text-sm md:text-lg font-street uppercase tracking-wider"
            >
              The Mission
            </Badge>
          </motion.div>

          <motion.h1
            className="text-3xl md:text-6xl lg:text-8xl font-street font-black text-white mb-4 md:mb-8 leading-tight"
            variants={slideInVariants}
          >
            PURPOSE OVER
            <br />
            <span className="text-brand-lime animate-glow">HYPE</span>
          </motion.h1>

          <motion.p className="text-lg md:text-2xl text-gray-300 font-bold" variants={itemVariants}>
            A movement for the real ones.
          </motion.p>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
          {/* Opening Statement */}
          <motion.div variants={itemVariants}>
            <Card className="bg-black/60 border-brand-lime/30 backdrop-blur-sm shadow-2xl">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-street font-black text-brand-lime mb-4 md:mb-6">
                  No Be Everybody Go Understand
                </h2>
                <div className="space-y-4 md:space-y-6 text-gray-100 text-base md:text-lg leading-relaxed">
                  <p>
                    The music industry don turn rat race. Same cycle, same lies — sign contract, lose your soul, make
                    small money, and fade. But not me. I no dey here to please anybody wey no dey from where I from. I
                    dey here to shake table, build something real for the people wey truly dey believe.
                  </p>
                  <p>
                    This platform na for those wey sabi say Erigga na more than music — na message, na movement, na
                    survival. Everything you see here — the music, the videos, the talks — na straight from my head, no
                    manager wey go filter my voice.
                  </p>
                  <p className="text-brand-lime font-bold">
                    This na for my true fans — those wey dey with me from "Motivation" to "Problem Nor Dey Finish" — and
                    still believe say we fit build street empire, from Warri to the world.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Hero Images Gallery */}
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6" variants={itemVariants}>
            {[
              { src: "/images/hero/erigga2.jpeg", alt: "Erigga performing live" },
              { src: "/images/hero/erigga3.jpeg", alt: "Erigga with the community" },
              { src: "/images/hero/erigga4.jpeg", alt: "Street culture representation" },
            ].map((image, index) => (
              <motion.div
                key={index}
                className="relative rounded-xl overflow-hidden shadow-2xl group"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <img
                  src={image.src || "/placeholder.svg"}
                  alt={image.alt}
                  className="w-full h-48 md:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white text-sm font-medium">{image.alt}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Real Impact Section */}
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-r from-brand-teal/20 to-brand-lime/20 border-brand-lime/30 backdrop-blur-sm shadow-2xl">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-street font-black text-white mb-4 md:mb-6">
                  Real Impact. No Gimmicks.
                </h2>
                <div className="space-y-4 md:space-y-6 text-gray-100 text-base md:text-lg leading-relaxed">
                  <p>
                    I believe say music fit inspire, not just entertain. And now, we go use this platform to give back.
                    Every merch wey you buy, every coin wey you spend go help us support families, boys and girls for
                    the hood wey need help.
                  </p>
                  <p className="text-brand-lime font-bold">
                    We go show everything — full transparency. From school packs for kids, to food drives and community
                    upgrades. Together, we go run am.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Code of the Street Members */}
          <motion.div variants={itemVariants}>
            <Card className="bg-black/60 border-gray-800/50 backdrop-blur-sm shadow-2xl">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-street font-black text-brand-lime mb-6 md:mb-8 text-center">
                  Code of the Street Members
                </h2>
                <p className="text-gray-100 text-base md:text-lg mb-6 md:mb-8 text-center">
                  If you wan join, just know say:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {streetCodeItems.map((item, index) => (
                    <motion.div
                      key={index}
                      className="bg-gradient-to-br from-brand-lime/10 to-brand-teal/10 p-4 md:p-6 rounded-lg border border-brand-lime/20 hover:border-brand-lime/50 transition-all duration-300"
                      whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(212, 237, 58, 0.2)" }}
                      variants={itemVariants}
                    >
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-lime rounded-full flex items-center justify-center text-black flex-shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <h3 className="text-brand-lime font-bold text-sm md:text-base mb-1 md:mb-2">
                            🎯 {item.title}
                          </h3>
                          <p className="text-gray-300 text-xs md:text-sm">{item.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Call to Action */}
          <motion.div className="text-center" variants={itemVariants}>
            <motion.div className="inline-block" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <div className="bg-gradient-to-r from-brand-lime to-brand-teal p-1 rounded-xl shadow-2xl">
                <div className="bg-black px-6 md:px-8 py-6 md:py-8 rounded-xl">
                  <p className="text-gray-300 text-base md:text-lg mb-4">
                    If this message enter your body — you already part of the mission.
                  </p>
                  <h2 className="text-2xl md:text-3xl font-street font-black text-white mb-4 md:mb-6">LET'S GET IT</h2>
                  <p className="text-brand-lime text-lg md:text-xl font-bold mb-6 md:mb-8">— Erigga Paperboi</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      asChild
                      className="bg-brand-lime text-black hover:bg-brand-lime/90 font-bold text-base md:text-lg px-6 md:px-8 py-3"
                    >
                      <Link href="/community">Join the Movement</Link>
                    </Button>
                    <Button
                      variant="outline"
                      asChild
                      className="border-brand-lime text-brand-lime hover:bg-brand-lime/10 font-bold text-base md:text-lg px-6 md:px-8 py-3 bg-transparent"
                    >
                      <Link href="/vault">Explore Content</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Floating Animation Elements */}
      <motion.div
        className="absolute top-20 right-4 md:right-10 w-16 h-16 md:w-20 md:h-20 bg-brand-lime/20 rounded-full blur-xl"
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 left-4 md:left-10 w-24 h-24 md:w-32 md:h-32 bg-brand-teal/20 rounded-full blur-xl"
        animate={{
          y: [0, 20, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 1,
        }}
      />
    </div>
  )
}
