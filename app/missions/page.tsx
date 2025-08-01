"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Target, Users, Crown, Coins, Zap, Star, ArrowRight } from "lucide-react"

export default function MissionsPage() {
  const missions = [
    {
      title: "Join the Movement",
      description: "Connect with the real ones in the Erigga community",
      icon: <Users className="h-8 w-8" />,
      color: "from-blue-500 to-cyan-500",
      delay: 0.1,
    },
    {
      title: "Earn & Cash Out",
      description: "Points, coins, and exclusive rewards for your loyalty",
      icon: <Coins className="h-8 w-8" />,
      color: "from-yellow-500 to-orange-500",
      delay: 0.2,
    },
    {
      title: "Exclusive Access",
      description: "Meet & Greet with Erigga, private content, and more",
      icon: <Crown className="h-8 w-8" />,
      color: "from-purple-500 to-pink-500",
      delay: 0.3,
    },
    {
      title: "Rep the Street",
      description: "Your profile, your hustle, your voice in the community",
      icon: <Star className="h-8 w-8" />,
      color: "from-green-500 to-emerald-500",
      delay: 0.4,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <Target className="h-16 w-16 mx-auto mb-6 text-blue-400" />
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-yellow-400 bg-clip-text text-transparent">
                MISSIONS
              </span>
            </h1>
          </motion.div>

          {/* Animated Mission Statement */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="max-w-4xl mx-auto mb-16"
          >
            <div className="text-2xl md:text-4xl font-bold leading-relaxed space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-red-400"
              >
                No space for dirty boxers.
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="text-red-400"
              >
                No space for fake fam.
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6, duration: 0.6 }}
                className="text-yellow-400"
              >
                Only room for the street kings and queens
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.0, duration: 0.6 }}
                className="text-blue-400"
              >
                who grind, rise, and rep Warri loud.
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.4, duration: 0.6 }}
                className="text-purple-400"
              >
                This is where the real ones connect,
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 1.2 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.8, duration: 0.6 }}
                className="text-green-400 relative"
              >
                cash out, and leave their mark.
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 3.2, duration: 0.4 }}
                  className="absolute -top-2 -right-2"
                >
                  <Zap className="h-8 w-8 text-yellow-400 animate-pulse" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Missions Cards */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-center mb-16"
          >
            Your <span className="text-blue-400">Street</span> Missions
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {missions.map((mission, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, rotateY: -15 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ delay: mission.delay, duration: 0.6 }}
                whileHover={{
                  scale: 1.05,
                  rotateY: 5,
                  transition: { duration: 0.3 },
                }}
                className="perspective-1000"
              >
                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm h-full overflow-hidden group">
                  <CardContent className="p-6 h-full flex flex-col">
                    <div
                      className={`w-16 h-16 rounded-full bg-gradient-to-r ${mission.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                    >
                      {mission.icon}
                    </div>

                    <h3 className="text-xl font-bold mb-4 text-white group-hover:text-blue-400 transition-colors">
                      {mission.title}
                    </h3>

                    <p className="text-gray-300 flex-grow leading-relaxed">{mission.description}</p>

                    <div className="mt-6">
                      <div
                        className={`h-1 bg-gradient-to-r ${mission.color} rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-yellow-600 p-1 rounded-2xl"
          >
            <div className="bg-gray-900 rounded-2xl p-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-yellow-400">Join</span>
                ?
              </h2>

              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Step into the Erigga Live community where real recognizes real. Your street journey starts here.
              </p>

              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 group"
                >
                  Join the Movement
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className="mt-8"
              >
                <div className="w-2 h-2 bg-blue-400 rounded-full mx-auto animate-pulse"></div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
