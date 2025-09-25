"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { PhoneBootAnimation } from "@/components/meet-and-greet/phone-boot-animation"
import { PaystackPayment } from "@/components/meet-and-greet/paystack-payment"
import { VideoCallRoom } from "@/components/meet-and-greet/video-call-room"

type PageState = "loading" | "payment" | "video-call"

interface PaymentRecord {
  id: string
  payment_reference: string
  session_room_id: string | null
  session_status: string
  expires_at: string
}

export default function MeetAndGreetPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [currentState, setCurrentState] = useState<PageState>("loading")
  const [paymentRecord, setPaymentRecord] = useState<PaymentRecord | null>(null)
  const [isCheckingPayment, setIsCheckingPayment] = useState(true)
  
  const amount = parseInt(process.env.NEXT_PUBLIC_MEETGREET_PRICE || "50000")
  const currency = process.env.NEXT_PUBLIC_MEETGREET_CURRENCY || "NGN"

  // Check for existing valid payment on component mount
  useEffect(() => {
    checkExistingPayment()
  }, [user])

  const checkExistingPayment = async () => {
    if (!user) {
      setIsCheckingPayment(false)
      return
    }

    try {
      const supabase = createClient()
      
      // Check for valid payment in the last 24 hours
      const { data: payments, error } = await supabase
        .from("meetgreet_payments")
        .select("*")
        .eq("user_id", user.id)
        .eq("payment_status", "completed")
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) {
        console.error("Payment check error:", error)
        // Don't show error to user, just proceed to payment
        setIsCheckingPayment(false)
        return
      }

      if (payments && payments.length > 0) {
        const payment = payments[0]
        setPaymentRecord(payment)
        
        // If session is already active, go directly to video call
        if (payment.session_status === 'active' && payment.session_room_id) {
          setCurrentState("video-call")
        } else {
          // Payment exists but session not started, wait for admin to start
          toast({
            title: "Payment Confirmed",
            description: "Your payment is confirmed. The session will start soon.",
          })
          setCurrentState("video-call")
        }
      }
    } catch (error) {
      console.error("Error checking payment:", error)
    } finally {
      setIsCheckingPayment(false)
    }
  }

  const handleAnimationComplete = () => {
    if (!paymentRecord) {
      setCurrentState("payment")
    } else {
      setCurrentState("video-call")
    }
  }

  const handlePaymentSuccess = async (reference: string) => {
    try {
      // Generate a unique room ID for ZEGOCLOUD
      const roomId = `erigga-meetgreet-${Date.now()}`
      
      // Update payment record with room ID
      const supabase = createClient()
      const { error } = await supabase
        .from("meetgreet_payments")
        .update({
          session_room_id: roomId,
          session_status: "scheduled"
        })
        .eq("payment_reference", reference)

      if (error) {
        console.error("Room ID update error:", error)
      }

      // Fetch the updated payment record
      await checkExistingPayment()
      
      toast({
        title: "Payment Successful!",
        description: "Connecting to video call room...",
      })
      
      setCurrentState("video-call")
    } catch (error) {
      console.error("Post-payment setup error:", error)
      toast({
        title: "Setup Error",
        description: "Payment successful but there was an error setting up the call.",
        variant: "destructive"
      })
    }
  }

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive"
    })
  }

  const handlePaymentClose = () => {
    toast({
      title: "Payment Cancelled",
      description: "You can try again anytime.",
    })
    // Stay on payment page
  }

  const handleLeaveVideoCall = () => {
    setCurrentState("payment")
    toast({
      title: "Call Ended",
      description: "Thank you for the Meet & Greet session!",
    })
  }

  // Show loading state while checking payment
  if (isCheckingPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
          <div className="text-white text-xl">Checking your session...</div>
        </motion.div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen w-full relative overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Loading/Boot Animation */}
          {currentState === "loading" && (
            <PhoneBootAnimation 
              key="loading" 
              onAnimationComplete={handleAnimationComplete}
            />
          )}

          {/* Payment Screen */}
          {currentState === "payment" && (
            <motion.div
              key="payment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-[url('/erigga/hero/erigga-main-hero.jpeg')] bg-cover bg-center opacity-20"></div>
              
              {/* Animated background particles */}
              <div className="absolute inset-0">
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full opacity-20"
                    animate={{
                      x: [0, Math.random() * 100, 0],
                      y: [0, Math.random() * 100, 0],
                      opacity: [0.2, 0.8, 0.2],
                    }}
                    transition={{
                      duration: Math.random() * 15 + 10,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                  />
                ))}
              </div>

              <div className="relative z-10">
                <PaystackPayment
                  amount={amount}
                  currency={currency}
                  userEmail={user?.email || ""}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onClose={handlePaymentClose}
                />
              </div>
            </motion.div>
          )}

          {/* Video Call Room */}
          {currentState === "video-call" && paymentRecord?.session_room_id && (
            <VideoCallRoom
              key="video-call"
              roomId={paymentRecord.session_room_id}
              userId={user?.id || ""}
              userName={user?.user_metadata?.full_name || user?.email || "Guest"}
              onLeave={handleLeaveVideoCall}
            />
          )}

          {/* Waiting for Session Start */}
          {currentState === "video-call" && !paymentRecord?.session_room_id && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-black flex items-center justify-center p-4"
            >
              <div className="text-center">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-24 h-24 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-6 animate-spin"
                />
                
                <h2 className="text-3xl font-bold text-white mb-4">
                  Payment Confirmed!
                </h2>
                
                <p className="text-white/80 text-lg mb-8 max-w-md">
                  Your payment has been successful. Please wait while we prepare your 
                  exclusive Meet & Greet session with Erigga.
                </p>
                
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 max-w-md mx-auto">
                  <h3 className="text-white font-semibold mb-3">What's Next:</h3>
                  <ul className="text-white/80 text-sm space-y-2 text-left">
                    <li>• The admin will start your session shortly</li>
                    <li>• You'll be automatically connected to the video call</li>
                    <li>• Make sure your camera and microphone are ready</li>
                    <li>• Enjoy your exclusive time with Erigga!</li>
                  </ul>
                </div>
                
                <motion.div
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                  className="text-yellow-400 text-sm mt-6"
                >
                  Session will begin automatically...
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  )
}