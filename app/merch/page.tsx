"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShoppingCart, Search, Filter, Gift, Clock, Star } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"

interface Freebie {
  id: string
  title: string
  description: string
  image_url: string
  available_until: string
  created_at: string
}

interface FreebiesClaim {
  id: string
  user_id: string
  freebie_id: string
  claimed_at: string
}

interface MerchItem {
  id: string
  name: string
  price: number
  image: string
  category: string
  inStock: boolean
  rating: number
  description: string
}

// Mock merch data
const MOCK_MERCH: MerchItem[] = [
  {
    id: "1",
    name: "Erigga Official T-Shirt",
    price: 25.99,
    image: "/placeholder.svg?height=300&width=300",
    category: "clothing",
    inStock: true,
    rating: 4.8,
    description: "Premium cotton t-shirt with official Erigga logo",
  },
  {
    id: "2",
    name: "Paper Boi Hoodie",
    price: 45.99,
    image: "/placeholder.svg?height=300&width=300",
    category: "clothing",
    inStock: true,
    rating: 4.9,
    description: "Comfortable hoodie featuring Paper Boi artwork",
  },
  {
    id: "3",
    name: "Erigga Cap",
    price: 19.99,
    image: "/placeholder.svg?height=300&width=300",
    category: "accessories",
    inStock: false,
    rating: 4.7,
    description: "Stylish cap with embroidered Erigga logo",
  },
  {
    id: "4",
    name: "Limited Edition Vinyl",
    price: 35.99,
    image: "/placeholder.svg?height=300&width=300",
    category: "music",
    inStock: true,
    rating: 5.0,
    description: "Limited edition vinyl record of latest album",
  },
]

function FreebiesBasket() {
  const [freebies, setFreebies] = useState<Freebie[]>([])
  const [userClaims, setUserClaims] = useState<FreebiesClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  const { user } = useAuth()
  const supabase = createClient()

  // Calculate time until end of month
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      const difference = endOfMonth.getTime() - now.getTime()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch freebies and user claims
  useEffect(() => {
    fetchFreebies()
    if (user) {
      fetchUserClaims()
    }
  }, [user])

  const fetchFreebies = async () => {
    try {
      const { data, error } = await supabase
        .from("freebies")
        .select("*")
        .gte("available_until", new Date().toISOString())
        .order("created_at", { ascending: false })

      if (error) throw error
      setFreebies(data || [])
    } catch (error) {
      console.error("Error fetching freebies:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserClaims = async () => {
    if (!user) return

    try {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from("freebies_claims")
        .select("*")
        .eq("user_id", user.id)
        .gte("claimed_at", startOfMonth.toISOString())

      if (error) throw error
      setUserClaims(data || [])
    } catch (error) {
      console.error("Error fetching user claims:", error)
    }
  }

  const claimFreebie = async (freebieId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to claim freebies",
        variant: "destructive",
      })
      return
    }

    // Check if user already claimed this month
    if (userClaims.length > 0) {
      toast({
        title: "Already Claimed",
        description: "You can only claim one freebie per month",
        variant: "destructive",
      })
      return
    }

    setClaiming(freebieId)
    try {
      const { error } = await supabase.from("freebies_claims").insert({
        user_id: user.id,
        freebie_id: freebieId,
      })

      if (error) throw error

      toast({
        title: "Freebie Claimed! 🎉",
        description: "Your freebie has been added to your account",
      })

      fetchUserClaims()
    } catch (error) {
      console.error("Error claiming freebie:", error)
      toast({
        title: "Claim Failed",
        description: "Unable to claim freebie. Please try again.",
        variant: "destructive",
      })
    } finally {
      setClaiming(null)
    }
  }

  const hasClaimedThisMonth = userClaims.length > 0

  return (
    <Card className="mb-8 border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-green-700">
          <Gift className="h-6 w-6" />🎁 Monthly Freebies Basket
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-green-600">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>
              Time left: {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : freebies.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <Gift className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No freebies right now</p>
            <p>Come back soon for exclusive free items!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {freebies.map((freebie) => (
              <Card key={freebie.id} className="border border-green-200">
                <div className="aspect-square relative overflow-hidden rounded-t-lg">
                  <Image
                    src={freebie.image_url || "/placeholder.svg"}
                    alt={freebie.title}
                    fill
                    className="object-cover"
                  />
                  <Badge className="absolute top-2 right-2 bg-green-600 text-white">FREE</Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{freebie.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{freebie.description}</p>
                  <Button
                    onClick={() => claimFreebie(freebie.id)}
                    disabled={!user || hasClaimedThisMonth || claiming === freebie.id}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {claiming === freebie.id ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Claiming...
                      </div>
                    ) : hasClaimedThisMonth ? (
                      "Already Claimed This Month"
                    ) : !user ? (
                      "Login to Claim"
                    ) : (
                      "Claim Now"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {hasClaimedThisMonth && (
          <div className="mt-4 p-4 bg-green-100 rounded-lg border border-green-200">
            <p className="text-green-700 font-medium">
              ✅ You've claimed your freebie for this month! Come back next month for more.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function MerchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [cart, setCart] = useState<{ [key: string]: number }>({})

  const filteredMerch = MOCK_MERCH.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  }).sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "rating":
        return b.rating - a.rating
      default:
        return a.name.localeCompare(b.name)
    }
  })

  const addToCart = (itemId: string) => {
    setCart((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }))
    toast({
      title: "Added to Cart",
      description: "Item has been added to your cart",
    })
  }

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, count) => sum + count, 0)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Erigga Merch Store</h1>
          <p className="text-gray-600">Official merchandise and exclusive items</p>
        </div>
        <Button className="relative bg-orange-500 hover:bg-orange-600">
          <ShoppingCart className="h-5 w-5 mr-2" />
          Cart
          {getTotalItems() > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs">
              {getTotalItems()}
            </Badge>
          )}
        </Button>
      </div>

      {/* Freebies Basket */}
      <FreebiesBasket />

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search merchandise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="clothing">Clothing</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
                <SelectItem value="music">Music</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Merchandise Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMerch.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square relative overflow-hidden">
              <Image
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
              {!item.inStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge variant="destructive">Out of Stock</Badge>
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-gray-600">{item.rating}</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-3">{item.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-orange-500">${item.price}</span>
                <Button
                  onClick={() => addToCart(item.id)}
                  disabled={!item.inStock}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMerch.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No merchandise found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
