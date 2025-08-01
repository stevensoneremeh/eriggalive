"use client"

import { useState, useEffect } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Target, Users, Crown, Coins, Zap, Trophy } from "lucide-react"
import Link from "next/link"

export default function MissionsPage() {
  const [mounted, setMounted] = useState(false)
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 300], [0, 50])
  const y2 = useTransform(scrollY, [0, 300], [0, -50])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gold-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Street Texture Overlay */}
      <div className="fixed inset-0 opacity-20 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTAgMEg0MFY0MEgwVjBaIiBmaWxsPSJ1cmwoI3BhaW50MF9yYWRpYWwpIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxyYWRpYWxHcmFkaWVudCBpZD0icGFpbnQwX3JhZGlhbCIgY3g9IjUwJSIgY3k9IjUwJSIgcj0iNTAlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzAwNzNlNiIgc3RvcC1vcGFjaXR5PSIwLjEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDA3M2U2IiBzdG9wLW9wYWNpdHk9IjAiLz4KPC9yYWRpYWxHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K')] bg-repeat" />

      <div className="relative z-10 pt-20">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 relative">
          <motion.div
            style={{ y: y1 }}
            className="absolute top-10 left-10 w-20 h-20 border-2 border-blue-400/30 rotate-45"
          />
          <motion.div
            style={{ y: y2 }}
            className="absolute bottom-20 right-20 w-16 h-16 border-2 border-gold-400/30 rounded-full"
          />

          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-12"
            >
              <h1 className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-blue-400 via-purple-400 to-gold-400 bg-clip-text text-transparent">
                ERIGGA MISSIONS
              </h1>
              <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-gold-400 mx-auto mb-8" />
            </motion.div>

            {/* Animated Mission Statement */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="max-w-4xl mx-auto mb-16"
            >
              <div className="text-2xl md:text-4xl font-bold leading-relaxed space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="relative"
                >
                  <span className="text-red-400">No space for dirty boxers.</span>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.5, type: "spring", stiffness: 300 }}
                    className="absolute -right-8 -top-2 text-red-500"
                  >
                    ❌
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5, duration: 0.8 }}
                >
                  <span className="text-red-400">No space for fake fam.</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2, duration: 0.8 }}
                  className="relative"
                >
                  <span className="text-gold-400">Only room for the street kings and queens</span>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5, duration: 1 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-400/20 to-transparent"
                  />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 3, type: "spring", stiffness: 200 }}
                    className="absolute -right-8 -top-2 text-gold-400"
                  >
                    👑
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.5, duration: 0.8 }}
                >
                  <span className="text-blue-400">who grind, rise, and rep Warri loud.</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 3, duration: 0.8 }}
                  className="text-purple-400"
                >
                  This is where the real ones connect,
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 3.5, duration: 0.8 }}
                  className="relative"
                >
                  <span className="text-gold-400 font-black">cash out,</span>
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 4, duration: 0.5 }}
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                  >
                    💰💰💰
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 4, duration: 0.8 }}
                  className="relative"
                >
                  <span className="text-blue-400">and leave their mark.</span>
                  <motion.div
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 4.5, duration: 2 }}
                    className="absolute inset-0 pointer-events-none"
                  >
                    <svg className="w-full h-full" viewBox="0 0 100 20">
                      <motion.path
                        d="M 10 10 Q 50 2 90 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-blue-400/50"
                      />
                    </svg>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 5, duration: 0.8 }}
            >
              <Link href="/login">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                  <Button
                    size="lg"
                    className="text-2xl px-12 py-6 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-black font-bold rounded-full shadow-2xl transform transition-all duration-300 animate-pulse"
                  >
                    <Zap className="mr-3 h-6 w-6" />
                    JOIN THE MOVEMENT
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Missions Cards Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold text-center mb-16 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
            >
              YOUR MISSIONS AWAIT
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  title: "Join the Movement",
                  description: "Connect with the real ones. Build your rep in the streets.",
                  icon: <Users className="h-8 w-8" />,
                  gradient: "from-blue-500 to-cyan-500",
                  delay: 0,
                },
                {
                  title: "Earn & Cash Out",
                  description: "Points, coins, and exclusive rewards for the grind.",
                  icon: <Coins className="h-8 w-8" />,
                  gradient: "from-gold-500 to-yellow-500",
                  delay: 0.2,
                },
                {
                  title: "Exclusive Access",
                  description: "Meet & Greet with Erigga, private content, VIP treatment.",
                  icon: <Crown className="h-8 w-8" />,
                  gradient: "from-purple-500 to-pink-500",
                  delay: 0.4,
                },
                {
                  title: "Rep the Street",
                  description: "Your profile, your hustle, your voice in the community.",
                  icon: <Trophy className="h-8 w-8" />,
                  gradient: "from-red-500 to-orange-500",
                  delay: 0.6,
                },
              ].map((mission, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50, rotateY: -15 }}
                  whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                  transition={{ delay: mission.delay, duration: 0.8 }}
                  whileHover={{
                    y: -10,
                    rotateY: 5,
                    transition: { duration: 0.3 },
                  }}
                  className="group"
                >
                  <Card className="h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 backdrop-blur-sm hover:border-gray-600/70 transition-all duration-300 overflow-hidden">
                    <CardContent className="p-8 text-center h-full flex flex-col justify-between">
                      <div>
                        <motion.div
                          whileHover={{ rotate: 360, scale: 1.2 }}
                          transition={{ duration: 0.6 }}
                          className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${mission.gradient} text-white mb-6 shadow-lg`}
                        >
                          {mission.icon}
                        </motion.div>

                        <h3 className="text-xl font-bold text-white mb-4 group-hover:text-gold-400 transition-colors">
                          {mission.title}
                        </h3>

                        <p className="text-gray-300 leading-relaxed">{mission.description}</p>
                      </div>

                      <motion.div
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`mt-6 h-1 bg-gradient-to-r ${mission.gradient} origin-left`}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-3xl p-12 border border-gray-700/50"
            >
              <h3 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gold-400 to-blue-400 bg-clip-text text-transparent">
                Ready to Make Your Mark?
              </h3>

              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Join thousands of street kings and queens already building their legacy in the Erigga community.
              </p>

              <Link href="/login">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                  <Button
                    size="lg"
                    className="text-xl px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-full shadow-2xl"
                  >
                    <Target className="mr-3 h-5 w-5" />
                    START YOUR JOURNEY
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  )
}
