"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Crown, Coins, Users, Star, ArrowRight, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function MissionPage() {
  const [currentLine, setCurrentLine] = useState(0)
  const heroRef = useRef(null)
  const isHeroInView = useInView(heroRef, { once: true })

  const missionLines = [
    "No space for dirty boxers.",
    "No space for fake fam.",
    "Only room for the street kings and queens",
    "who grind, rise, and rep Warri loud.",
    "This is where the real ones connect,",
    "cash out, and leave their mark.",
  ]

  const missions = [
    {
      icon: Users,
      title: "Join the Movement",
      description:
        "Connect with the real ones. Build your crew, share your story, and become part of the Warri street family.",
      color: "from-blue-500 to-cyan-400",
      delay: 0,
    },
    {
      icon: Coins,
      title: "Earn & Cash Out",
      description:
        "Stack points, collect coins, and unlock exclusive rewards. Your hustle pays off in the streets and online.",
      color: "from-yellow-500 to-orange-400",
      delay: 0.2,
    },
    {
      icon: Crown,
      title: "Exclusive Access",
      description:
        "Meet & Greet with Erigga, private content drops, and VIP experiences. Crown yourself with exclusive access.",
      color: "from-purple-500 to-pink-400",
      delay: 0.4,
    },
    {
      icon: Star,
      title: "Rep the Street",
      description: "Your profile, your hustle, your voice. Show the world what Warri street culture is all about.",
      color: "from-green-500 to-emerald-400",
      delay: 0.6,
    },
  ]

  useEffect(() => {
    if (isHeroInView) {
      const timer = setInterval(() => {
        setCurrentLine((prev) => {
          if (prev < missionLines.length - 1) {
            return prev + 1
          }
          clearInterval(timer)
          return prev
        })
      }, 1500)
      return () => clearInterval(timer)
    }
  }, [isHeroInView, missionLines.length])

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800" />
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Animated smoke/fog effect */}
        <motion.div
          className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-blue-900/20 to-transparent"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        {/* Street texture overlay */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTAgMEg0MFY0MEgwVjBaIiBmaWxsPSJ1cmwoI3BhaW50MF9yYWRpYWwpIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxyYWRpYWxHcmFkaWVudCBpZD0icGFpbnQwX3JhZGlhbCIgY3g9IjUwJSIgY3k9IjUwJSIgcj0iNTAlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzAwNzNlNiIgc3RvcC1vcGFjaXR5PSIwLjEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDA3M2U2IiBzdG9wLW9wYWNpdHk9IjAiLz4KPC9yYWRpYWxHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K')] bg-repeat" />
      </div>

      <div className="relative z-10 pt-20">
        {/* Hero Section */}
        <section ref={heroRef} className="min-h-screen flex items-center justify-center px-4 relative">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-12"
            >
              <h1 className="text-6xl md:text-8xl font-black mb-8 bg-gradient-to-r from-blue-400 via-white to-yellow-400 bg-clip-text text-transparent">
                ERIGGA MISSION
              </h1>
              <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-yellow-500 mx-auto mb-8" />
            </motion.div>

            <div className="space-y-4 text-2xl md:text-4xl font-bold leading-tight mb-16">
              {missionLines.map((line, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{
                    opacity: currentLine >= index ? 1 : 0,
                    x: currentLine >= index ? 0 : -50,
                  }}
                  transition={{
                    duration: 0.8,
                    delay: 0.2,
                    type: "spring",
                    stiffness: 100,
                  }}
                  className={`
                    ${line.includes("dirty boxers") ? "text-red-400" : ""}
                    ${line.includes("street kings and queens") ? "text-yellow-400" : ""}
                    ${line.includes("cash out") ? "text-green-400" : ""}
                    ${line.includes("leave their mark") ? "text-blue-400" : ""}
                  `}
                >
                  {line.includes("dirty boxers") && (
                    <motion.span
                      animate={
                        currentLine >= index
                          ? {
                              x: [0, -5, 5, 0],
                              rotate: [0, -2, 2, 0],
                            }
                          : {}
                      }
                      transition={{ duration: 0.5, delay: 1 }}
                    >
                      {line}
                    </motion.span>
                  )}
                  {line.includes("cash out") && currentLine >= index && (
                    <>
                      {line}
                      <motion.div
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: [0, 1, 0], y: [0, -30, -60] }}
                        transition={{ duration: 1, delay: 1.5 }}
                        className="inline-block ml-2"
                      >
                        💰
                      </motion.div>
                    </>
                  )}
                  {!line.includes("dirty boxers") && !line.includes("cash out") && line}
                </motion.div>
              ))}
            </div>

            {/* Scroll indicator */}
            <motion.div
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              <div className="w-6 h-10 border-2 border-blue-400 rounded-full flex justify-center">
                <div className="w-1 h-3 bg-blue-400 rounded-full mt-2" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Missions Section */}
        <section className="relative z-10 py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-blue-400 to-yellow-400 bg-clip-text text-transparent">
                THE MISSIONS
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Four pillars that define the Erigga Live experience. Choose your path, build your legacy.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {missions.map((mission, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, rotateY: 90 }}
                  whileInView={{ opacity: 1, rotateY: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: mission.delay,
                    type: "spring",
                    stiffness: 100,
                  }}
                  whileHover={{
                    scale: 1.05,
                    rotateY: 5,
                    z: 50,
                  }}
                  viewport={{ once: true }}
                  className="group relative"
                >
                  <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl h-full transition-all duration-300 group-hover:border-blue-500/50 group-hover:shadow-2xl group-hover:shadow-blue-500/20">
                    <CardContent className="p-6 text-center h-full flex flex-col justify-between">
                      <div>
                        <div
                          className={`w-16 h-16 rounded-full bg-gradient-to-r ${mission.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto`}
                        >
                          <mission.icon className="w-8 h-8 text-white" />
                        </div>

                        <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-400 transition-colors duration-300">
                          {mission.title}
                        </h3>

                        <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                          {mission.description}
                        </p>
                      </div>

                      {/* Hover glow effect */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative z-10 py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-black mb-8">
                Ready to <span className="text-yellow-400">Join the Movement</span>?
              </h2>
              <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
                Step into the streets of Warri. Connect with the real ones. Build your legacy.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(59, 130, 246, 0.3)",
                      "0 0 40px rgba(59, 130, 246, 0.6)",
                      "0 0 20px rgba(59, 130, 246, 0.3)",
                    ],
                  }}
                  transition={{
                    boxShadow: {
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    },
                  }}
                >
                  <Button
                    asChild
                    size="lg"
                    className="group relative bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 px-12 rounded-full text-xl transition-all duration-300 overflow-hidden"
                  >
                    <Link href="/signup" className="flex items-center gap-3">
                      <span className="relative z-10 flex items-center gap-3">
                        Join the Movement
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-bold py-4 px-12 rounded-full text-xl transition-all duration-300 bg-transparent"
                  >
                    <Link href="/login" className="flex items-center gap-3">
                      <Target className="w-6 h-6" />
                      Already a Member?
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer accent */}
        <div className="relative z-10 h-32 bg-gradient-to-t from-blue-900/20 to-transparent" />
      </div>
    </div>
  )
}
