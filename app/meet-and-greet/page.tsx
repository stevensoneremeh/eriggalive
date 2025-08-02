"use client"

import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Phone, Video, Calendar, Star, Coins, Crown, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MeetGreetPackage {
  id: string
  name: string
  duration: number
  price_coins: number
  price_usd: number
  features: string[]
  type: "call" | "video" | "premium"
  popular?: boolean
}

export default function MeetAndGreetPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [bookingStep, setBookingStep] = useState<"select" | "details" | "payment" | "confirmation">("select")
  const [bookingDetails, setBookingDetails] = useState({
    preferredDate: "",
    preferredTime: "",
    message: "",
    specialRequest: "",
  })

  const packages: MeetGreetPackage[] = [
    {
      id: "basic-call",
      name: "Voice Call",
      duration: 5,
      price_coins: 500,
      price_usd: 25,
      features: ["5-minute voice call with Erigga", "Personal greeting", "Ask one question", "Digital certificate"],
      type: "call",
    },
    {
      id: "video-call",
      name: "Video Call",
      duration: 10,
      price_coins: 1000,
      price_usd: 50,
      features: [
        "10-minute video call with Erigga",
        "Personal greeting & conversation",
        "Ask multiple questions",
        "Screenshot opportunity",
        "Digital certificate",
        "Priority booking",
      ],
      type: "video",
      popular: true,
    },
    {
      id: "premium-session",
      name: "Premium Session",
      duration: 20,
      price_coins: 2000,
      price_usd: 100,
      features: [
        "20-minute premium video session",
        "Extended personal conversation",
        "Music discussion & recommendations",
        "Behind-the-scenes stories",
        "Multiple screenshots",
        "Signed digital poster",
        "VIP certificate",
        "Priority support",
      ],
      type: "premium",
    },
  ]

  const getPackageIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="w-8 h-8" />
      case "video":
        return <Video className="w-8 h-8" />
      case "premium":
        return <Crown className="w-8 h-8" />
      default:
        return <Phone className="w-8 h-8" />
    }
  }

  const getPackageColor = (type: string) => {
    switch (type) {
      case "call":
        return "from-blue-500 to-blue-600"
      case "video":
        return "from-purple-500 to-purple-600"
      case "premium":
        return "from-yellow-500 to-yellow-600"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  const handleBooking = async () => {
    if (!selectedPackage || !profile) return

    const pkg = packages.find((p) => p.id === selectedPackage)
    if (!pkg) return

    // Check if user has enough coins
    if ((profile.coins || 0) < pkg.price_coins) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${pkg.price_coins} coins for this package. You have ${profile.coins || 0} coins.`,
        variant: "destructive",
      })
      return
    }

    // In a real app, you would process the payment and create the booking
    toast({
      title: "Booking Confirmed! 🎉",
      description: `Your ${pkg.name} session has been booked. You'll receive confirmation details soon.`,
    })

    setBookingStep("confirmation")
  }

  const selectedPkg = packages.find((p) => p.id === selectedPackage)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-6">
              <Phone className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Meet & Greet with Erigga</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get a personal one-on-one session with Erigga. Choose from voice calls, video chats, or premium sessions.
            </p>
          </div>

          {bookingStep === "select" && (
            <>
              {/* Packages */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {packages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className={`relative cursor-pointer transition-all duration-300 hover:shadow-xl ${
                      selectedPackage === pkg.id ? "ring-2 ring-purple-500 shadow-xl" : ""
                    } ${pkg.popular ? "scale-105" : ""}`}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1">
                          <Star className="w-4 h-4 mr-1" />
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-4">
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${getPackageColor(pkg.type)} rounded-full text-white mb-4 mx-auto`}
                      >
                        {getPackageIcon(pkg.type)}
                      </div>
                      <CardTitle className="text-2xl font-bold">{pkg.name}</CardTitle>
                      <CardDescription className="text-lg">{pkg.duration} minutes</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Pricing */}
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <Coins className="w-6 h-6 text-yellow-500" />
                          <span className="text-3xl font-bold text-gray-900 dark:text-white">{pkg.price_coins}</span>
                          <span className="text-gray-500">coins</span>
                        </div>
                        <p className="text-sm text-gray-500">or ${pkg.price_usd} USD</p>
                      </div>

                      {/* Features */}
                      <div className="space-y-3">
                        {pkg.features.map((feature, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* Select Button */}
                      <Button
                        className={`w-full ${
                          selectedPackage === pkg.id ? "bg-gradient-to-r from-purple-500 to-blue-500" : ""
                        }`}
                        variant={selectedPackage === pkg.id ? "default" : "outline"}
                        onClick={() => setSelectedPackage(pkg.id)}
                      >
                        {selectedPackage === pkg.id ? "Selected" : "Select Package"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Continue Button */}
              {selectedPackage && (
                <div className="text-center">
                  <Button
                    size="lg"
                    onClick={() => setBookingStep("details")}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    Continue to Booking Details
                  </Button>
                </div>
              )}
            </>
          )}

          {bookingStep === "details" && selectedPkg && (
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-6 h-6 mr-2" />
                    Booking Details
                  </CardTitle>
                  <CardDescription>
                    Selected: {selectedPkg.name} ({selectedPkg.duration} minutes)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="date">Preferred Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={bookingDetails.preferredDate}
                        onChange={(e) =>
                          setBookingDetails((prev) => ({
                            ...prev,
                            preferredDate: e.target.value,
                          }))
                        }
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Preferred Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={bookingDetails.preferredTime}
                        onChange={(e) =>
                          setBookingDetails((prev) => ({
                            ...prev,
                            preferredTime: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Personal Message (Optional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell Erigga what you'd like to talk about..."
                      value={bookingDetails.message}
                      onChange={(e) =>
                        setBookingDetails((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="special">Special Requests (Optional)</Label>
                    <Textarea
                      id="special"
                      placeholder="Any special requests or questions you'd like to ask?"
                      value={bookingDetails.specialRequest}
                      onChange={(e) =>
                        setBookingDetails((prev) => ({
                          ...prev,
                          specialRequest: e.target.value,
                        }))
                      }
                      rows={2}
                    />
                  </div>

                  <div className="flex space-x-4">
                    <Button variant="outline" onClick={() => setBookingStep("select")} className="flex-1">
                      Back
                    </Button>
                    <Button
                      onClick={() => setBookingStep("payment")}
                      disabled={!bookingDetails.preferredDate || !bookingDetails.preferredTime}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500"
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {bookingStep === "payment" && selectedPkg && (
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Coins className="w-6 h-6 mr-2" />
                    Payment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Booking Summary */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold text-lg">Booking Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Package:</span>
                        <span className="font-medium">{selectedPkg.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{selectedPkg.duration} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{bookingDetails.preferredDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span>{bookingDetails.preferredTime}</span>
                      </div>
                      <div className="border-t pt-2 mt-4">
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total Cost:</span>
                          <div className="flex items-center space-x-2">
                            <Coins className="w-5 h-5 text-yellow-500" />
                            <span>{selectedPkg.price_coins} coins</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Payment Method</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Coins className="w-6 h-6 text-yellow-500" />
                          <div>
                            <p className="font-medium">Erigga Coins</p>
                            <p className="text-sm text-gray-500">Balance: {profile?.coins || 0} coins</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {(profile?.coins || 0) >= selectedPkg.price_coins ? (
                            <Badge className="bg-green-100 text-green-800">Sufficient Balance</Badge>
                          ) : (
                            <Badge variant="destructive">Insufficient Balance</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button variant="outline" onClick={() => setBookingStep("details")} className="flex-1">
                      Back
                    </Button>
                    <Button
                      onClick={handleBooking}
                      disabled={(profile?.coins || 0) < selectedPkg.price_coins}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500"
                    >
                      Confirm Booking
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {bookingStep === "confirmation" && selectedPkg && (
            <div className="max-w-2xl mx-auto text-center">
              <Card>
                <CardContent className="p-8">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Booking Confirmed!</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Your {selectedPkg.name} session has been successfully booked. You'll receive a confirmation email
                    with all the details shortly.
                  </p>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold mb-4">What happens next?</h3>
                    <div className="space-y-3 text-sm text-left">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          1
                        </div>
                        <p>You'll receive a confirmation email within 24 hours</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          2
                        </div>
                        <p>Our team will contact you to schedule the exact time</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          3
                        </div>
                        <p>You'll receive the call/video link before your session</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setBookingStep("select")
                      setSelectedPackage(null)
                      setBookingDetails({
                        preferredDate: "",
                        preferredTime: "",
                        message: "",
                        specialRequest: "",
                      })
                    }}
                    className="bg-gradient-to-r from-purple-500 to-blue-500"
                  >
                    Book Another Session
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* FAQ Section */}
          {bookingStep === "select" && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
                Frequently Asked Questions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">How do I prepare for my session?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300">
                      Just be yourself! Think of a few questions you'd like to ask Erigga. Make sure you have a stable
                      internet connection for video calls.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Can I reschedule my session?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300">
                      Yes, you can reschedule up to 24 hours before your session. Contact our support team for
                      assistance.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">What if I have technical issues?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300">
                      Our technical support team will be available during your session to help with any issues that may
                      arise.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Can I record the session?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300">
                      Recording is not permitted to respect privacy. However, you can take screenshots during video
                      calls as mentioned in the package features.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
