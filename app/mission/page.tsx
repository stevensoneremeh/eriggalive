"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

  const textVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fillRule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fillOpacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] bg-repeat" />
      </div>

      {/* Gradient Overlays */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-brand-lime/5 via-transparent to-brand-teal/5" />
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent" />

      <motion.div
        className="container mx-auto px-4 py-16 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div 
          className="text-center mb-16"
          variants={itemVariants}
        >
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
            className="text-6xl md:text-8xl font-street font-black text-white mb-8 leading-tight"
            variants={textVariants}
          >
            NO SPACE FOR
            <br />
            <span className="text-brand-lime animate-glow">DIRTY BOXERS</span>
          </motion.h1>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          className="max-w-4xl mx-auto"
          variants={itemVariants}
        >
          <Card className="bg-black/40 border-gray-800/50 backdrop-blur-sm">
            <CardContent className="p-8 md:p-12">
              <motion.div 
                className="space-y-8 text-gray-100"
                variants={containerVariants}
              >
                <motion.p 
                  className="text-xl md:text-2xl font-bold text-brand-lime leading-relaxed"
                  variants={textVariants}
                >
                  This platform isn't built for profit — it's built for purpose.
                </motion.p>

                <motion.p 
                  className="text-lg md:text-xl leading-relaxed"
                  variants={textVariants}
                >
                  Erigga believes in giving more than he takes. This isn't just a fan hub; 
                  it's a <span className="text-brand-lime font-bold">street-powered engine for growth</span>.
                </motion.p>

                <motion.p 
                  className="text-lg md:text-xl leading-relaxed"
                  variants={textVariants}
                >
                  Every naira, every stream, and every coin earned here goes beyond fame — 
                  it flows into the heart of the community. From grassroots education to 
                  real street impact, this movement is about 
                  <span className="text-brand-lime font-bold"> raising minds, not margins</span>.
                </motion.p>

                <motion.div 
                  className="bg-gradient-to-r from-brand-teal/20 to-brand-lime/20 p-6 rounded-lg border border-brand-lime/30"
                  variants={itemVariants}
                >
                  <p className="text-lg md:text-xl font-bold text-center leading-relaxed">
                    Whether you're a <span className="text-brand-lime">Street Rep</span>, 
                    <span className="text-brand-lime"> Warri Elite</span>, or 
                    <span className="text-brand-lime"> Erigma Circle</span> — know this:
                  </p>
                  <p className="text-2xl md:text-3xl font-street font-black text-center mt-4 text-white">
                    You're part of something bigger.
                  </p>
                </motion.div>

                {/* Core Values */}
                <motion.div 
                  className="grid md:grid-cols-3 gap-6 mt-12"
                  variants={containerVariants}
                >
                  {[
                    { title: "Purpose", subtitle: "over paper", icon: "🎯" },
                    { title: "Streets", subtitle: "over stunts", icon: "🏙️" },
                    { title: "Loyalty", subtitle: "over likes", icon: "🤝" }
                  ].map((value, index) => (
                    <motion.div
                      key={index}
                      className="text-center p-6 bg-black/30 rounded-lg border border-gray-800/50 hover:border-brand-lime/50 transition-all duration-300"
                      variants={itemVariants}
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: "0 0 30px rgba(212, 237, 58, 0.2)"
                      }}
                    >
                      <div className="text-4xl mb-4">{value.icon}</div>
                      <h3 className="text-2xl font-street font-bold text-brand-lime mb-2">
                        {value.title}
                      </h3>
                      <p className="text-gray-300 text-lg">{value.subtitle}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div 
          className="text-center mt-16"
          variants={itemVariants}
        >
          <motion.div
            className="inline-block"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="bg-gradient-to-r from-brand-lime to-brand-teal p-1 rounded-lg">
              <div className="bg-black px-8 py-4 rounded-lg">
                <p className="text-2xl md:text-3xl font-street font-black text-white">
                  JOIN THE MOVEMENT
                </p>
                <p className="text-brand-lime text-lg mt-2">
                  Be part of something bigger than yourself
                </p>
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
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-20 left-10 w-32 h-32 bg-brand-teal/20 rounded-full blur-xl"
        animate={{
          y: [0, 20, 0],
          opacity: [0.2, 0.5, 0.2]
        }}
        transition={{
          duration: 5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 1
        }}
      />
    </div>
  )
}
