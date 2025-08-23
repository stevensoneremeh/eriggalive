"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Calendar, MapPin, Users, CreditCard, Coins, Shield, CheckCircle } from "lucide-react"
import { PaystackIntegration } from "@/components/paystack/paystack-integration"

interface Event {
  id: string
  title: string
  description: string
  event_date: string
  venue: string
  address?: string
  ticket_price: number
  coin_price?: number
  max_capacity: number
  tickets_sold: number
  status: string
  image_url?: string
}

interface TicketPurchaseModalProps {
  event: Event | null
  isOpen: boolean
  onClose: () => void
  userEmail?: string
  userCoins?: number
  onPurchaseSuccess: (ticket: any) => void
  onPurchaseError: (error: string) => void
}

export function TicketPurchaseModal({
  event,
  isOpen,
  onClose,
  userEmail,
  userCoins = 0,
  onPurchaseSuccess,
  onPurchaseError,
}: TicketPurchaseModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "coins">("paystack")
  const [isProcessing, setIsProcessing] = useState(false)
  const [purchaseStep, setPurchaseStep] = useState<"select" | "processing" | "success">("select")

  if (!event) return null

  const formatPrice = (priceInKobo: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(priceInKobo / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleCoinPurchase = async () => {
    if (!event.coin_price) return

    setIsProcessing(true)
    setPurchaseStep("processing")

    try {
      const response = await fetch("/api/tickets/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event.id,
          paymentMethod: "coins",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Purchase failed")
      }

      setPurchaseStep("success")
      onPurchaseSuccess(data.ticket)

      // Close modal after 3 seconds
      setTimeout(() => {
        onClose()
        setPurchaseStep("select")
      }, 3000)
    } catch (error) {
      console.error("Coin purchase error:", error)
      onPurchaseError(error instanceof Error ? error.message : "Purchase failed")
      setPurchaseStep("select")
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaystackSuccess = async (reference: string) => {
    setIsProcessing(true)
    setPurchaseStep("processing")

    try {
      const response = await fetch("/api/tickets/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event.id,
          paymentMethod: "paystack",
          reference,
          amount: Math.floor(event.ticket_price / 100), // Convert to naira
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Purchase failed")
      }

      setPurchaseStep("success")
      onPurchaseSuccess(data.ticket)

      // Close modal after 3 seconds
      setTimeout(() => {
        onClose()
        setPurchaseStep("select")
      }, 3000)
    } catch (error) {
      console.error("Paystack purchase error:", error)
      onPurchaseError(error instanceof Error ? error.message : "Purchase failed")
      setPurchaseStep("select")
    } finally {
      setIsProcessing(false)
    }
  }

  const canAffordCoins = event.coin_price ? userCoins >= event.coin_price : false
  const spotsLeft = event.max_capacity - event.tickets_sold

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Purchase Ticket
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {purchaseStep === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Event Details */}
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">{event.title}</h3>
                      <p className="text-slate-300">{event.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <span>{formatDate(event.event_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span>{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Users className="w-4 h-4 text-green-400" />
                        <span>{spotsLeft} spots left</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Shield className="w-4 h-4 text-orange-400" />
                        <span>Secure Purchase</span>
                      </div>
                    </div>

                    {event.address && (
                      <div className="text-sm text-slate-400">
                        <strong>Address:</strong> {event.address}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method Selection */}
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Choose Payment Method</h4>

                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as "paystack" | "coins")}
                  >
                    {/* Paystack Payment */}
                    <div className="flex items-center space-x-3 p-4 rounded-lg border border-slate-600 hover:border-purple-500 transition-colors">
                      <RadioGroupItem value="paystack" id="paystack" />
                      <Label htmlFor="paystack" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="font-medium">Card Payment</p>
                              <p className="text-sm text-slate-400">Pay with debit/credit card via Paystack</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{formatPrice(event.ticket_price)}</p>
                            <Badge variant="outline" className="text-xs">
                              Secure
                            </Badge>
                          </div>
                        </div>
                      </Label>
                    </div>

                    {/* Coin Payment */}
                    {event.coin_price && (
                      <div
                        className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
                          canAffordCoins ? "border-slate-600 hover:border-blue-500" : "border-red-500/50 bg-red-500/5"
                        }`}
                      >
                        <RadioGroupItem value="coins" id="coins" disabled={!canAffordCoins} />
                        <Label
                          htmlFor="coins"
                          className={`flex-1 ${canAffordCoins ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Coins className="w-5 h-5 text-blue-400" />
                              <div>
                                <p className="font-medium">Erigga Coins</p>
                                <p className="text-sm text-slate-400">
                                  Your balance: {userCoins.toLocaleString()} coins
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">{event.coin_price.toLocaleString()} coins</p>
                              {!canAffordCoins && (
                                <Badge variant="destructive" className="text-xs">
                                  Insufficient
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Label>
                      </div>
                    )}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Purchase Summary */}
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Purchase Summary</h4>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Event Ticket</span>
                      <span className="font-medium">
                        {paymentMethod === "paystack"
                          ? formatPrice(event.ticket_price)
                          : `${event.coin_price?.toLocaleString()} coins`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Processing Fee</span>
                      <span className="font-medium text-green-400">Free</span>
                    </div>
                    <Separator className="bg-slate-600" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-purple-400">
                        {paymentMethod === "paystack"
                          ? formatPrice(event.ticket_price)
                          : `${event.coin_price?.toLocaleString()} coins`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Purchase Button */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                  Cancel
                </Button>

                {paymentMethod === "paystack" && userEmail ? (
                  <PaystackIntegration
                    amount={Math.floor(event.ticket_price / 100)} // Convert to naira
                    email={userEmail}
                    metadata={{
                      event_id: event.id,
                      event_title: event.title,
                      ticket_type: "general",
                    }}
                    onSuccess={handlePaystackSuccess}
                    onError={onPurchaseError}
                  >
                    <Button
                      className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90"
                      disabled={isProcessing}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay with Card
                    </Button>
                  </PaystackIntegration>
                ) : paymentMethod === "coins" ? (
                  <Button
                    onClick={handleCoinPurchase}
                    disabled={!canAffordCoins || isProcessing}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 disabled:opacity-50"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Pay with Coins
                  </Button>
                ) : (
                  <Button disabled className="flex-1 bg-gray-600">
                    Login Required
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {purchaseStep === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-6"
              />
              <h3 className="text-xl font-semibold mb-2">Processing Your Purchase</h3>
              <p className="text-slate-400">Please wait while we confirm your payment...</p>
            </motion.div>
          )}

          {purchaseStep === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2 text-green-400">Purchase Successful!</h3>
              <p className="text-slate-400 mb-4">Your ticket has been confirmed and sent to your account.</p>
              <p className="text-sm text-slate-500">This window will close automatically...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
