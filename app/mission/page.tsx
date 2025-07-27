"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Users, Heart, Target } from "lucide-react"
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
        staggerChildren: 0.2,
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

  const titleVariants = {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Hero Background Image */}
      <div className="absolute inset-0 opacity-20">
        <img src="/images/hero/erigga1.jpeg" alt="Erigga street background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </div>

      {/* Gradient Overlays */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-brand-lime/5 via-transparent to-brand-teal/5" />
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/80 to-transparent" />

      <motion.div
        className="container mx-auto px-4 py-16 relative z-10"
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
        <motion.div className="text-center mb-16" variants={titleVariants}>
          <motion.div
            className="inline-block mb-6"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Badge
              variant="outline"
              className="text-brand-lime border-brand-lime/50 bg-brand-lime/10 px-6 py-2 text-lg font-street uppercase tracking-wider"
            >
              Our Mission
            </Badge>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl lg:text-8xl font-street font-black text-white mb-8 leading-tight"
            variants={itemVariants}
          >
            NO SPACE FOR
            <br />
            <span className="text-brand-lime animate-glow">DIRTY BOXERS</span>
          </motion.h1>
        </motion.div>

        {/* Hero Image Gallery */}
        <motion.div className="grid md:grid-cols-3 gap-4 mb-16" variants={itemVariants}>
          {[
            { src: "/images/hero/erigga2.jpeg", alt: "Erigga performing" },
            { src: "/images/hero/erigga3.jpeg", alt: "Erigga with fans" },
            { src: "/images/hero/erigga4.jpeg", alt: "Erigga street culture" },
          ].map((image, index) => (
            <motion.div
              key={index}
              className="relative rounded-xl overflow-hidden shadow-2xl"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img src={image.src || "/placeholder.svg"} alt={image.alt} className="w-full h-48 md:h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content */}
        <motion.div className="max-w-4xl mx-auto" variants={itemVariants}>
          <Card className="bg-black/40 border-gray-800/50 backdrop-blur-sm shadow-2xl">
            <CardContent className="p-8 md:p-12">
              <motion.div className="space-y-8 text-gray-100" variants={containerVariants}>
                <motion.p
                  className="text-xl md:text-2xl font-bold text-brand-lime leading-relaxed text-center"
                  variants={itemVariants}
                >
                  This platform isn't built for profit — it's built for purpose.
                </motion.p>

                <motion.p className="text-lg md:text-xl leading-relaxed" variants={itemVariants}>
                  Erigga believes in giving more than he takes. This isn't just a fan hub; it's a{" "}
                  <span className="text-brand-lime font-bold">street-powered engine for growth</span>.
                </motion.p>

                <motion.p className="text-lg md:text-xl leading-relaxed" variants={itemVariants}>
                  Every naira, every stream, and every coin earned here goes beyond fame — it flows into the heart of
                  the community. From grassroots education to real street impact, this movement is about{" "}
                  <span className="text-brand-lime font-bold">raising minds, not margins</span>.
                </motion.p>

                <motion.div
                  className="bg-gradient-to-r from-brand-teal/20 to-brand-lime/20 p-6 rounded-lg border border-brand-lime/30"
                  variants={itemVariants}
                >
                  <p className="text-lg md:text-xl font-bold text-center leading-relaxed">
                    Whether you're a <span className="text-brand-lime">Street Rep</span>,{" "}
                    <span className="text-brand-lime">Warri Elite</span>, or{" "}
                    <span className="text-brand-lime">Erigma Circle</span> — know this:
                  </p>
                  <p className="text-2xl md:text-3xl font-street font-black text-center mt-4 text-white">
                    You're part of something bigger.
                  </p>
                </motion.div>

                {/* Core Values */}
                <motion.div className="grid md:grid-cols-3 gap-6 mt-12" variants={containerVariants}>
                  {[
                    {
                      title: "Purpose over paper",
                      icon: <Target className="w-8 h-8" />,
                      description: "Every action driven by meaningful impact",
                      color: "from-brand-lime/20 to-brand-lime/10",
                    },
                    {
                      title: "Streets over stunts",
                      icon: <Users className="w-8 h-8" />,
                      description: "Authentic community over flashy displays",
                      color: "from-brand-teal/20 to-brand-teal/10",
                    },
                    {
                      title: "Loyalty over likes",
                      icon: <Heart className="w-8 h-8" />,
                      description: "Real connections over social metrics",
                      color: "from-brand-lime/20 to-brand-teal/20",
                    },
                  ].map((value, index) => (
                    <motion.div
                      key={index}
                      className={`text-center p-6 bg-gradient-to-br ${value.color} rounded-lg border border-gray-800/50 hover:border-brand-lime/50 transition-all duration-300 backdrop-blur-sm`}
                      variants={itemVariants}
                      whileHover={{
                        scale: 1.05,
                        boxShadow: "0 0 30px rgba(212, 237, 58, 0.2)",
                      }}
                    >
                      <div className="w-16 h-16 bg-brand-lime rounded-full flex items-center justify-center mx-auto mb-4 text-black">
                        {value.icon}
                      </div>
                      <h3 className="text-xl font-street font-bold text-brand-lime mb-2">{value.title}</h3>
                      <p className="text-gray-300 text-sm">{value.description}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Call to Action */}
        <motion.div className="text-center mt-16" variants={itemVariants}>
          <motion.div className="inline-block" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <div className="bg-gradient-to-r from-brand-lime to-brand-teal p-1 rounded-lg shadow-2xl">
              <div className="bg-black px-8 py-6 rounded-lg">
                <h2 className="text-2xl md:text-3xl font-street font-black text-white mb-2">JOIN THE MOVEMENT</h2>
                <p className="text-brand-lime text-lg mb-4">Be part of something bigger than yourself</p>
                <Button asChild className="bg-brand-lime text-black hover:bg-brand-lime/90 font-bold">
                  <Link href="/community">Get Started</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Floating Elements */}
      <motion.div
        className="absolute top-20 right-10 w-20 h-20 bg-brand-lime/20 rounded-full blur-xl"
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
        className="absolute bottom-20 left-10 w-32 h-32 bg-brand-teal/20 rounded-full blur-xl"
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
