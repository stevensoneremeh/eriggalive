"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Users, Coins, CreditCard, Ticket } from "lucide-react"
import { PaystackIntegration } from "@/components/paystack/paystack-integration"
import { useToast } from "@/components/ui/use-toast"
import type { Event } from "@/lib/types/ticketing"

interface TicketPurchaseProps {
  event: Event
  userEmail?: string
  userCoins?: number
  onPurchaseSuccess?: (ticket: any) => void
}

export function TicketPurchase({ event, userEmail, userCoins = 0, onPurchaseSuccess }: TicketPurchaseProps) {
  const [purchasing, setPurchasing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "coin">("paystack")
  const { toast } = useToast()

  const coinPrice = event.ticket_price * 2 // 1 NGN = 2 coins
  const canAffordWithCoins = userCoins >= coinPrice
  const spotsLeft = event.capacity - event.current_reservations

  const handlePaystackPurchase = async (paymentReference: string) => {
    try {
      setPurchasing(true)

      const response = await fetch("/api/tickets/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: event.id,
          method: "paystack",
          payment_reference: paymentReference,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Ticket Purchased!",
          description: "Your ticket has been successfully purchased.",
        })
        onPurchaseSuccess?.(data.ticket)
      } else {
        toast({
          title: "Purchase Failed",
          description: data.error || "Failed to purchase ticket",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Purchase error:", error)
      toast({
        title: "Purchase Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setPurchasing(false)
    }
  }

  const handleCoinPurchase = async () => {
    try {
      setPurchasing(true)

      const response = await fetch("/api/tickets/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: event.id,
          method: "coin",
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Ticket Purchased!",
          description: "Your ticket has been successfully purchased with coins.",
        })
        onPurchaseSuccess?.(data.ticket)
      } else {
        toast({
          title: "Purchase Failed",
          description: data.error || "Failed to purchase ticket",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Purchase error:", error)
      toast({
        title: "Purchase Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setPurchasing(false)
    }
  }

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    })
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

  if (spotsLeft <= 0) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6 text-center">
          <Ticket className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Event Sold Out</h3>
          <p className="text-red-600">This event has reached maximum capacity.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{event.title}</span>
          <Badge variant={event.status === "active" ? "default" : "secondary"}>{event.status}</Badge>
        </CardTitle>
        <CardDescription>{event.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span>{formatDate(event.event_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-500" />
            <span>{event.venue}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-500" />
            <span>{spotsLeft} spots left</span>
          </div>
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-blue-500" />
            <span>₦{event.ticket_price.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "paystack" | "coin")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paystack" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Card Payment
            </TabsTrigger>
            <TabsTrigger value="coin" className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Erigga Coins
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paystack" className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Pay with Card</h4>
              <p className="text-sm text-gray-600 mb-4">Secure payment powered by Paystack</p>
              <div className="text-2xl font-bold text-blue-600">₦{event.ticket_price.toLocaleString()}</div>
            </div>

            {userEmail ? (
              <PaystackIntegration
                amount={event.ticket_price}
                email={userEmail}
                metadata={{
                  event_id: event.id,
                  event_title: event.title,
                }}
                onSuccess={handlePaystackPurchase}
                onError={handlePaymentError}
              >
                <Button className="w-full" disabled={purchasing}>
                  {purchasing ? "Processing..." : `Pay ₦${event.ticket_price.toLocaleString()}`}
                </Button>
              </PaystackIntegration>
            ) : (
              <Button disabled className="w-full">
                Login Required
              </Button>
            )}
          </TabsContent>

          <TabsContent value="coin" className="space-y-4">
            <div className={`p-4 rounded-lg ${canAffordWithCoins ? "bg-green-50" : "bg-red-50"}`}>
              <h4 className="font-semibold mb-2">Pay with Erigga Coins</h4>
              <p className="text-sm text-gray-600 mb-4">
                Your balance: {userCoins.toLocaleString()} coins
                <br />
                Required: {coinPrice.toLocaleString()} coins
              </p>
              <div className="text-2xl font-bold text-yellow-600">{coinPrice.toLocaleString()} coins</div>
            </div>

            <Button
              onClick={handleCoinPurchase}
              disabled={!canAffordWithCoins || purchasing}
              className="w-full"
              variant={canAffordWithCoins ? "default" : "secondary"}
            >
              {purchasing
                ? "Processing..."
                : canAffordWithCoins
                  ? `Pay ${coinPrice.toLocaleString()} Coins`
                  : "Insufficient Coins"}
            </Button>

            {!canAffordWithCoins && (
              <p className="text-sm text-red-600 text-center">
                You need {(coinPrice - userCoins).toLocaleString()} more coins to purchase this ticket.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
