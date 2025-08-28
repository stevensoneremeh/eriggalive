"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CreditCard, Coins, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { PaystackIntegration } from "@/components/paystack/paystack-integration"
import { createClient } from "@/lib/supabase/client"

const FEATURE_UI_FIXES_V1 = process.env.NEXT_PUBLIC_FEATURE_UI_FIXES_V1 === "true"

interface SurveyData {
  location: string
  favoriteSong: string
  hopedSong: string
  hearAbout: string
  specialRequests: string
}

interface EventData {
  id: string
  title: string
  event_date: string
  venue: string
  ticket_price_naira: number
  ticket_price_coins: number
  max_capacity: number
  current_attendance: number
}

export default function EventPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get("event")
  const { user, profile } = useAuth()

  const [surveyData, setSurveyData] = useState<SurveyData | null>(null)
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<"paystack" | "coins" | null>(null)
  const [loading, setLoading] = useState(false)
  const [coinBalance, setCoinBalance] = useState(0)
  const [error, setError] = useState("")
  const supabase = createClient()

  const TICKET_PRICE = 2000000 // 20,000 naira in kobo
  const TICKET_PRICE_COINS = 10000

  useEffect(() => {
    // Get survey data from localStorage
    const storedSurveyData = localStorage.getItem("eventSurveyData")
    if (storedSurveyData) {
      setSurveyData(JSON.parse(storedSurveyData))
    }

    if (eventId) {
      fetchEventData()
    }

    // Fetch user's coin balance
    fetchCoinBalance()
  }, [eventId])

  const fetchEventData = async () => {
    if (!eventId) return

    try {
      const { data, error } = await supabase
        .from("events")
        .select(
          "id, title, event_date, venue, ticket_price_naira, ticket_price_coins, max_capacity, current_attendance",
        )
        .eq("id", eventId)
        .single()

      if (error) {
        console.error("Error fetching event:", error)
        setEventData({
          id: eventId,
          title: "ERIGGA Live - Intimate Session",
          event_date: "2025-09-03T20:00:00",
          venue: "Uncle Jaffi at The Playground, Warri",
          ticket_price_naira: 20000,
          ticket_price_coins: 10000,
          max_capacity: 200,
          current_attendance: 45,
        })
      } else {
        setEventData(data)
      }
    } catch (error) {
      console.error("Error fetching event data:", error)
    }
  }

  const fetchCoinBalance = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.from("profiles").select("coins").eq("id", user.id).single()

      if (error) throw error
      setCoinBalance(data?.coins || 0)
    } catch (error) {
      console.error("Error fetching coin balance:", error)
    }
  }

  const handleCoinPayment = async () => {
    if (!user || !surveyData || !eventData) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/tickets/purchase-with-coins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: eventData.id,
          userId: user.id,
          coinAmount: TICKET_PRICE_COINS,
          surveyData,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Payment failed")
      }

      // Clear survey data from localStorage
      localStorage.removeItem("eventSurveyData")

      // Redirect to success page with ticket ID
      router.push(`/events/success?ticketId=${result.ticketId}`)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePaystackSuccess = async (reference: string) => {
    if (!user || !surveyData || !eventData) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/tickets/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: eventData.id,
          userId: user.id,
          paystackReference: reference,
          amount: TICKET_PRICE,
          surveyData,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Payment failed")
      }

      // Clear survey data from localStorage
      localStorage.removeItem("eventSurveyData")

      // Redirect to success page with ticket ID
      router.push(`/events/success?ticketId=${result.ticketId}`)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePaystackError = (error: any) => {
    setError("Payment failed. Please try again.")
    console.error("Paystack error:", error)
  }

  if (!surveyData || !eventData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-white">Loading payment details...</p>
        </div>
      </div>
    )
  }

  const displayTitle = eventData?.title || "ERIGGA Live - Intimate Session"
  const displayVenue = eventData?.venue || "Uncle Jaffi at The Playground, Warri"
  const displayPrice = 20000
  const displayCoins = TICKET_PRICE_COINS

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-red-900/20" />
      <div className="absolute inset-0 bg-[url('/placeholder-kzlwg.png')] opacity-10 bg-cover bg-center" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/events/survey"
            className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Survey
          </Link>

          <motion.h1
            className="text-4xl md:text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textShadow: "0 0 30px rgba(239, 68, 68, 0.5)",
              fontFamily: "Impact, Arial Black, sans-serif",
            }}
          >
            SECURE YOUR SPOT
          </motion.h1>
          <motion.p
            className="text-xl text-gray-300 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Choose your payment method for the ultimate Erigga experience
          </motion.p>
        </div>

        {/* Event Summary */}
        <motion.div
          className="max-w-2xl mx-auto mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-gray-900 to-black border-2 border-red-500/30">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">{displayTitle}</CardTitle>
              <p className="text-gray-300">Wednesday, 3rd September 2025</p>
              <p className="text-gray-400">{displayVenue}</p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500 mb-2">
                ₦{displayPrice.toLocaleString()}
              </div>
              <p className="text-gray-400">Premium Access Ticket</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Options */}
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-gray-900 to-black border-2 border-red-500/30">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">Choose Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <p className="text-red-300">{error}</p>
                </div>
              )}

              {/* Paystack Payment */}
              <div className="space-y-4">
                <div
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    selectedPayment === "paystack"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-600 hover:border-blue-400"
                  }`}
                  onClick={() => setSelectedPayment("paystack")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CreditCard className="h-8 w-8 text-blue-400" />
                      <div>
                        <h3 className="text-xl font-bold text-white">Card Payment</h3>
                        <p className="text-gray-400">Pay with debit/credit card via Paystack</p>
                      </div>
                    </div>
                    {selectedPayment === "paystack" && <CheckCircle className="h-6 w-6 text-blue-400" />}
                  </div>
                </div>

                {selectedPayment === "paystack" && profile?.email && (
                  <PaystackIntegration
                    amount={TICKET_PRICE}
                    email={profile.email}
                    metadata={{
                      event_id: eventData?.id || eventId,
                      event_title: displayTitle,
                      user_id: user?.id,
                      survey_data: surveyData,
                    }}
                    onSuccess={handlePaystackSuccess}
                    onError={handlePaystackError}
                  >
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-4 text-lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          Pay ₦{displayPrice.toLocaleString()} with Card
                        </>
                      )}
                    </Button>
                  </PaystackIntegration>
                )}
              </div>

              {/* Erigga Coins Payment */}
              <div className="space-y-4">
                <div
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    selectedPayment === "coins"
                      ? "border-yellow-500 bg-yellow-500/10"
                      : "border-gray-600 hover:border-yellow-400"
                  }`}
                  onClick={() => setSelectedPayment("coins")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Coins className="h-8 w-8 text-yellow-400" />
                      <div>
                        <h3 className="text-xl font-bold text-white">Erigga Coins</h3>
                        <p className="text-gray-400">Pay with your reward points</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                            Balance: {coinBalance.toLocaleString()} coins
                          </Badge>
                          {coinBalance < TICKET_PRICE_COINS && (
                            <Badge variant="destructive" className="text-xs">
                              Insufficient balance
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedPayment === "coins" && <CheckCircle className="h-6 w-6 text-yellow-400" />}
                  </div>
                </div>

                {selectedPayment === "coins" && (
                  <Button
                    onClick={handleCoinPayment}
                    className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-black font-bold py-4 text-lg"
                    disabled={loading || coinBalance < TICKET_PRICE_COINS}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Coins className="h-5 w-5 mr-2" />
                        Pay {displayCoins.toLocaleString()} Erigga Coins
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
