"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShoppingCart, Heart, Star, Coins, CreditCard, Gift, Clock, Calendar } from "lucide-react"
import { CoinBalance } from "@/components/coin-balance"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// Mock product data - in a real app, this would come from the API
const products = [
  {
    id: 1,
    name: "Paper Boi Hoodie",
    description: "Premium quality hoodie with Erigga's signature Paper Boi design",
    price: 15000,
    coin_price: 1500,
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "clothing",
    is_premium_only: false,
    stock_quantity: 25,
    rating: 4.8,
    reviews: 124,
  },
  {
    id: 2,
    name: "Warri Vibe T-Shirt",
    description: "Comfortable cotton t-shirt representing Warri culture",
    price: 8000,
    coin_price: 800,
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["S", "M", "L", "XL"],
    category: "clothing",
    is_premium_only: false,
    stock_quantity: 50,
    rating: 4.6,
    reviews: 89,
  },
  {
    id: 3,
    name: "Erigga Signature Cap",
    description: "Adjustable cap with embroidered Erigga logo",
    price: 5000,
    coin_price: 500,
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["One Size"],
    category: "accessories",
    is_premium_only: false,
    stock_quantity: 75,
    rating: 4.7,
    reviews: 156,
  },
  {
    id: 4,
    name: "Limited Edition Vinyl Record",
    description: "Exclusive vinyl record of 'The Erigma' album - Blood tier exclusive",
    price: 25000,
    coin_price: 2500,
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["Standard"],
    category: "collectibles",
    is_premium_only: true,
    required_tier: "blood",
    stock_quantity: 10,
    rating: 5.0,
    reviews: 23,
  },
  {
    id: 5,
    name: "Street Chronicles Poster Set",
    description: "Set of 3 high-quality posters from different eras",
    price: 3000,
    coin_price: 300,
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["A2"],
    category: "collectibles",
    is_premium_only: false,
    stock_quantity: 100,
    rating: 4.5,
    reviews: 67,
  },
  {
    id: 6,
    name: "Erigga Phone Case",
    description: "Protective phone case with custom Erigga artwork",
    price: 4500,
    coin_price: 450,
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["iPhone 14", "iPhone 15", "Samsung S23", "Samsung S24"],
    category: "accessories",
    is_premium_only: false,
    stock_quantity: 40,
    rating: 4.4,
    reviews: 78,
  },
]

interface Freebie {
  id: number
  title: string
  description: string
  image_url: string
  available_until: string
  max_claims: number
  current_claims: number
  created_at: string
}

interface FreebiesClaim {
  id: number
  user_id: number
  freebie_id: number
  claimed_at: string
}

interface ProductCardProps {
  product: (typeof products)[0]
  onAddToCart: (product: (typeof products)[0], size: string, paymentMethod: "cash" | "coins") => void
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { profile } = useAuth()
  const [selectedSize, setSelectedSize] = useState(product.sizes[0])
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "coins">("cash")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const canPurchase = () => {
    if (product.is_premium_only && product.required_tier) {
      if (!profile) return false

      const tierLevels = {
        grassroot: 0,
        pioneer: 1,
        elder: 2,
        blood: 3,
      }

      const userLevel = tierLevels[profile.tier]
      const requiredLevel = tierLevels[product.required_tier as keyof typeof tierLevels]

      return userLevel >= requiredLevel
    }

    return true
  }

  const handlePurchase = () => {
    if (paymentMethod === "coins" && profile && profile.coins < product.coin_price) {
      alert("Insufficient coins. Please purchase more coins or pay with cash.")
      return
    }

    onAddToCart(product, selectedSize, paymentMethod)
    setIsDialogOpen(false)
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 bg-card/50 border-orange-500/20">
      <div className="relative overflow-hidden">
        <img
          src={product.images[0] || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.is_premium_only && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white">
            {product.required_tier?.toUpperCase()} Only
          </Badge>
        )}
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-white/80 hover:bg-white">
          <Heart className="h-4 w-4" />
        </Button>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg group-hover:text-orange-500 transition-colors">{product.name}</h3>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm text-muted-foreground">{product.rating}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <div className="font-bold text-lg">₦{product.price.toLocaleString()}</div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Coins className="h-3 w-3 text-yellow-500 mr-1" />
              {product.coin_price} coins
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {product.stock_quantity} in stock
          </Badge>
        </div>

        {canPurchase() ? (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-black">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add to Cart</DialogTitle>
                <DialogDescription>Configure your purchase options for {product.name}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {product.sizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Payment Method</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as "cash" | "coins")}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div
                      className={`border rounded-lg p-4 cursor-pointer ${
                        paymentMethod === "cash" ? "border-orange-500 bg-orange-500/10" : ""
                      }`}
                    >
                      <RadioGroupItem value="cash" id="cash" className="sr-only" />
                      <Label htmlFor="cash" className="flex items-center cursor-pointer">
                        <CreditCard className="h-5 w-5 mr-2" />
                        <div>
                          <div className="font-medium">Cash Payment</div>
                          <div className="text-sm text-muted-foreground">₦{product.price.toLocaleString()}</div>
                        </div>
                      </Label>
                    </div>

                    <div
                      className={`border rounded-lg p-4 cursor-pointer ${
                        paymentMethod === "coins" ? "border-orange-500 bg-orange-500/10" : ""
                      }`}
                    >
                      <RadioGroupItem value="coins" id="coins" className="sr-only" />
                      <Label htmlFor="coins" className="flex items-center cursor-pointer">
                        <Coins className="h-5 w-5 mr-2 text-yellow-500" />
                        <div>
                          <div className="font-medium">Erigga Coins</div>
                          <div className="text-sm text-muted-foreground">{product.coin_price} coins</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === "coins" && profile && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span>Your Balance:</span>
                        <div className="flex items-center font-medium">
                          <Coins className="h-4 w-4 text-yellow-500 mr-1" />
                          {profile.coins} coins
                        </div>
                      </div>
                      {profile.coins < product.coin_price && (
                        <p className="text-xs text-red-500 mt-1">
                          Insufficient coins. You need {product.coin_price - profile.coins} more coins.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-black"
                    onClick={handlePurchase}
                    disabled={paymentMethod === "coins" && profile && profile.coins < product.coin_price}
                  >
                    Add to Cart
                  </Button>

                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Button disabled className="w-full">
            {product.required_tier?.toUpperCase()} Members Only
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function FreebiesBasket() {
  const { profile } = useAuth()
  const [freebies, setFreebies] = useState<Freebie[]>([])
  const [userClaims, setUserClaims] = useState<FreebiesClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [timeToEndOfMonth, setTimeToEndOfMonth] = useState("")

  // Calculate countdown to end of month
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      const diff = endOfMonth.getTime() - now.getTime()

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

        setTimeToEndOfMonth(`${days}d ${hours}h ${minutes}m`)
      } else {
        setTimeToEndOfMonth("Expired")
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  // Fetch freebies and user claims
  useEffect(() => {
    const fetchFreebies = async () => {
      try {
        const supabase = createClient()

        // Fetch current month's freebies
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const { data: freebiesData, error: freebiesError } = await supabase
          .from("freebies")
          .select("*")
          .gte("available_until", startOfMonth.toISOString())
          .lte("available_until", endOfMonth.toISOString())
          .eq("is_active", true)

        if (freebiesError) {
          console.error("Error fetching freebies:", freebiesError)
          return
        }

        setFreebies(freebiesData || [])

        // Fetch user claims if authenticated
        if (profile) {
          const { data: claimsData, error: claimsError } = await supabase
            .from("freebie_claims")
            .select("*")
            .eq("user_id", profile.id)
            .gte("claimed_at", startOfMonth.toISOString())

          if (claimsError) {
            console.error("Error fetching claims:", claimsError)
            return
          }

          setUserClaims(claimsData || [])
        }
      } catch (error) {
        console.error("Error in fetchFreebies:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFreebies()
  }, [profile])

  const handleClaimFreebie = async (freebieId: number) => {
    if (!profile) {
      toast.error("Please log in to claim freebies")
      return
    }

    try {
      const supabase = createClient()

      // Check if user already claimed this freebie
      const alreadyClaimed = userClaims.some((claim) => claim.freebie_id === freebieId)
      if (alreadyClaimed) {
        toast.error("You've already claimed this freebie this month")
        return
      }

      // Create claim record
      const { error } = await supabase.from("freebie_claims").insert({
        user_id: profile.id,
        freebie_id: freebieId,
        claimed_at: new Date().toISOString(),
      })

      if (error) {
        console.error("Error claiming freebie:", error)
        toast.error("Failed to claim freebie. Please try again.")
        return
      }

      // Update local state
      setUserClaims((prev) => [
        ...prev,
        {
          id: Date.now(), // Temporary ID
          user_id: profile.id,
          freebie_id: freebieId,
          claimed_at: new Date().toISOString(),
        },
      ])

      toast.success("Freebie claimed successfully! Check your account.")
    } catch (error) {
      console.error("Error in handleClaimFreebie:", error)
      toast.error("An error occurred. Please try again.")
    }
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-500" />🎁 Monthly Freebies Basket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-green-500" />🎁 Monthly Freebies Basket
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Ends in: {timeToEndOfMonth}</span>
        </div>
      </CardHeader>
      <CardContent>
        {freebies.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No freebies right now. Come back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {freebies.map((freebie) => {
              const alreadyClaimed = userClaims.some((claim) => claim.freebie_id === freebie.id)
              const isAvailable = new Date(freebie.available_until) > new Date()
              const canClaim = profile && !alreadyClaimed && isAvailable && freebie.current_claims < freebie.max_claims

              return (
                <div
                  key={freebie.id}
                  className="flex items-center gap-4 p-4 bg-background/50 rounded-lg border border-green-500/20"
                >
                  <img
                    src={freebie.image_url || "/placeholder.svg?height=80&width=80"}
                    alt={freebie.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-600">{freebie.title}</h4>
                    <p className="text-sm text-muted-foreground">{freebie.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>
                        {freebie.current_claims}/{freebie.max_claims} claimed
                      </span>
                      <span>Until: {new Date(freebie.available_until).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {alreadyClaimed ? (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                        Claimed ✓
                      </Badge>
                    ) : canClaim ? (
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleClaimFreebie(freebie.id)}
                      >
                        Claim Now
                      </Button>
                    ) : !profile ? (
                      <Button size="sm" variant="outline" disabled>
                        Login to Claim
                      </Button>
                    ) : !isAvailable ? (
                      <Badge variant="destructive">Expired</Badge>
                    ) : (
                      <Badge variant="secondary">Sold Out</Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function MerchPage() {
  const { profile } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [cart, setCart] = useState<
    Array<{
      product: (typeof products)[0]
      size: string
      paymentMethod: "cash" | "coins"
      quantity: number
    }>
  >([])

  const categories = [
    { value: "all", label: "All Items" },
    { value: "clothing", label: "Clothing" },
    { value: "accessories", label: "Accessories" },
    { value: "collectibles", label: "Collectibles" },
  ]

  const filteredProducts =
    selectedCategory === "all" ? products : products.filter((product) => product.category === selectedCategory)

  const handleAddToCart = (product: (typeof products)[0], size: string, paymentMethod: "cash" | "coins") => {
    setCart((prev) => {
      const existingItem = prev.find(
        (item) => item.product.id === product.id && item.size === size && item.paymentMethod === paymentMethod,
      )

      if (existingItem) {
        return prev.map((item) => (item === existingItem ? { ...item, quantity: item.quantity + 1 } : item))
      } else {
        return [...prev, { product, size, paymentMethod, quantity: 1 }]
      }
    })

    // Show success message
    toast.success(`${product.name} (${size}) added to cart!`)
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="font-street text-4xl md:text-6xl text-gradient mb-2">MERCH STORE</h1>
            <p className="text-muted-foreground">Official Erigga merchandise and collectibles</p>
          </div>

          <div className="flex items-center gap-4">
            {profile && <CoinBalance size="md" />}
            <Button variant="outline" className="relative bg-transparent">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </Button>
          </div>
        </div>

        {/* Freebies Basket */}
        <div className="mb-8">
          <FreebiesBasket />
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              {categories.map((category) => (
                <TabsTrigger key={category.value} value={category.value} className="text-xs">
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/50 border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-500" />
                Pay with Erigga Coins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use your Erigga Coins to purchase merchandise at discounted rates. Earn coins by engaging with content
                and participating in the community.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-orange-500/20">
            <CardHeader>
              <CardTitle>Free Shipping</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Free shipping on orders over ₦10,000 within Nigeria. International shipping available for premium
                members.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-orange-500/20">
            <CardHeader>
              <CardTitle>Exclusive Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Some items are exclusive to higher-tier members. Upgrade your membership to access limited edition
                collectibles.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
