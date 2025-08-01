"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Crown, Users, Trophy, Target, Coins, Zap } from "lucide-react"

export default function MissionsPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-yellow-900/20" />
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] opacity-10" />

      {/* Animated smoke */}
      <div className="absolute top-0 left-0 w-full h-full">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-40 right-20 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <motion.h1
            className="text-6xl md:text-8xl font-black mb-8 leading-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 2 }}
          >
            <motion.div
              className="bg-gradient-to-r from-neon-blue via-white to-gold bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            >
              THE MISSION
            </motion.div>
          </motion.h1>

          {/* Animated Mission Statement */}
          <div className="max-w-4xl mx-auto space-y-6 text-xl md:text-2xl font-bold">
            <motion.p
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="text-gray-300"
            >
              No space for dirty boxers.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              className="text-gray-300"
            >
              No space for fake fam.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2, duration: 1 }}
              className="relative"
            >
              <p className="text-neon-blue text-3xl md:text-4xl font-black">
                Only room for the street kings and queens
              </p>
              <motion.div
                className="absolute -inset-4 bg-blue-500/20 blur-xl rounded-lg"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.5, duration: 0.8 }}
              className="text-gray-300"
            >
              who grind, rise, and rep Warri loud.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 3, duration: 1 }}
              className="relative"
            >
              <p className="text-gold text-3xl md:text-4xl font-black">This is where the real ones connect,</p>
              <motion.div
                className="absolute -inset-4 bg-yellow-500/20 blur-xl rounded-lg"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 3.5, duration: 0.8 }}
              className="text-neon-blue font-black text-2xl md:text-3xl"
            >
              cash out, and leave their mark.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 4, duration: 1 }}
              className="text-center pt-8"
            >
              <motion.div
                className="inline-block text-6xl"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                💫
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Mission Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4.5, duration: 1 }}
        >
          {[
            {
              title: "Join the Movement",
              description: "Connect with the real ones",
              icon: <Users className="h-8 w-8" />,
              color: "from-blue-500 to-cyan-500",
              bgColor: "bg-blue-500/10",
            },
            {
              title: "Earn & Cash Out",
              description: "Points, coins, and exclusive rewards",
              icon: <Coins className="h-8 w-8" />,
              color: "from-yellow-500 to-orange-500",
              bgColor: "bg-yellow-500/10",
            },
            {
              title: "Exclusive Access",
              description: "Meet & Greet with Erigga, private content",
              icon: <Crown className="h-8 w-8" />,
              color: "from-purple-500 to-pink-500",
              bgColor: "bg-purple-500/10",
            },
            {
              title: "Rep the Street",
              description: "Your profile, your hustle, your voice",
              icon: <Trophy className="h-8 w-8" />,
              color: "from-green-500 to-emerald-500",
              bgColor: "bg-green-500/10",
            },
          ].map((mission, index) => (
            <motion.div
              key={mission.title}
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              transition={{ delay: 5 + index * 0.2, duration: 0.8 }}
              whileHover={{
                scale: 1.05,
                rotateY: 10,
                transition: { duration: 0.3 },
              }}
            >
              <Card
                className={`${mission.bgColor} border-2 border-gray-800 hover:border-gray-600 transition-all duration-300 h-full backdrop-blur-sm`}
              >
                <CardContent className="p-6 text-center h-full flex flex-col justify-between">
                  <div>
                    <motion.div
                      className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${mission.color} flex items-center justify-center`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      {mission.icon}
                    </motion.div>
                    <h3 className="text-xl font-bold mb-3 text-white">{mission.title}</h3>
                    <p className="text-gray-300 text-sm">{mission.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 6, duration: 1 }}
        >
          <Link href="/login">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="text-xl px-12 py-6 bg-gradient-to-r from-neon-blue to-gold hover:from-blue-600 hover:to-yellow-600 text-black font-black shadow-2xl relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-white"
                  animate={{
                    opacity: [0, 0.3, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
                <span className="relative z-10 flex items-center gap-3">
                  <Target className="h-6 w-6" />
                  JOIN THE MOVEMENT
                  <Zap className="h-6 w-6" />
                </span>
              </Button>
            </motion.div>
          </Link>

          <motion.p
            className="mt-6 text-gray-400 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 6.5, duration: 1 }}
          >
            Ready to rep Warri and make your mark?
          </motion.p>
        </motion.div>
      </div>

      {/* Custom styles for neon colors */}
      <style jsx>{`
        .text-neon-blue {
          color: #00f5ff;
          text-shadow: 0 0 10px #00f5ff;
        }
        .text-gold {
          color: #ffd700;
          text-shadow: 0 0 10px #ffd700;
        }
        .from-neon-blue {
          --tw-gradient-from: #00f5ff;
        }
        .to-gold {
          --tw-gradient-to: #ffd700;
        }
      `}</style>
    </div>
  )
}
