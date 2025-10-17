"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Crown, Coins, Users, Star, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function MissionsPage() {
  const missions = [
    {
      title: "Join the Movement",
      description: "Connect with the real ones",
      icon: Users,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Earn & Cash Out",
      description: "Points, coins, and exclusive rewards",
      icon: Coins,
      color: "from-yellow-500 to-orange-500",
    },
    {
      title: "Exclusive Access",
      description: "Meet & Greet with Erigga, private content",
      icon: Crown,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Rep the Street",
      description: "Your profile, your hustle, your voice",
      icon: Star,
      color: "from-green-500 to-emerald-500",
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-yellow-900/20" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              <motion.span
                className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-yellow-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
              >
                No space for dirty boxers.
              </motion.span>
              <motion.span
                className="block mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
              >
                No space for fake fam.
              </motion.span>
              <motion.span
                className="block mt-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
              >
                Only room for the street kings and queens
              </motion.span>
              <motion.span
                className="block mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
              >
                who grind, rise, and rep Warri loud.
              </motion.span>
            </h1>

            <motion.p
              className="text-xl md:text-2xl text-gray-300 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5, duration: 1 }}
            >
              This is where the real ones connect, <span className="text-yellow-400 font-bold">cash out</span>, and
              leave their mark.
            </motion.p>
          </motion.div>

          {/* Mission Cards */}
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3, duration: 1 }}
          >
            {missions.map((mission, index) => (
              <motion.div
                key={mission.title}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3 + index * 0.2, duration: 0.8 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="group"
              >
                <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${mission.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    >
                      <mission.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white">{mission.title}</h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors">{mission.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 4, duration: 0.8 }}
          >
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-yellow-600 hover:from-blue-700 hover:via-purple-700 hover:to-yellow-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 animate-pulse"
            >
              <Link href="/signup" className="flex items-center gap-2">
                Join the Movement
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
