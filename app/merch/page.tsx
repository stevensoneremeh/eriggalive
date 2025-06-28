"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShoppingCart, Heart, Star, Coins, CreditCard, Gift, Package } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import type { FreebieItem } from "@/types/freebies"

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
      toast.error("Insufficient coins. Please purchase more coins or pay with cash.")
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

interface FreebieCardProps {
  freebie: FreebieItem
  onClaim: (freebie: FreebieItem) => void
}

function FreebieCard({ freebie, onClaim }: FreebieCardProps) {
  const { profile } = useAuth()

  const canClaim = () => {
    if (!profile) return false

    const tierLevels = {
      grassroot: 0,
      pioneer: 1,
      elder: 2,
      blood: 3,
    }

    const userLevel = tierLevels[profile.tier]
    const requiredLevel = tierLevels[freebie.required_tier]

    return userLevel >= requiredLevel && freebie.stock_quantity > 0
  }

  const isExpired = freebie.expires_at && new Date(freebie.expires_at) < new Date()

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 bg-card/50 border-green-500/20">
      <div className="relative overflow-hidden">
        <img
          src={freebie.images[0] || "/placeholder.svg"}
          alt={freebie.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Badge className="absolute top-2 left-2 bg-green-500 text-white">
          <Gift className="h-3 w-3 mr-1" />
          FREE
        </Badge>
        {freebie.is_featured && <Badge className="absolute top-2 right-2 bg-orange-500 text-white">Featured</Badge>}
        {isExpired && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive">Expired</Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg group-hover:text-green-500 transition-colors">{freebie.name}</h3>
          <Badge variant="outline" className="text-xs">
            {freebie.required_tier.toUpperCase()}+
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{freebie.description}</p>

        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <div className="font-bold text-lg text-green-600">FREE</div>
            <div className="text-xs text-muted-foreground">Max {freebie.max_per_user} per user</div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-xs mb-1">
              {freebie.stock_quantity} left
            </Badge>
            <div className="text-xs text-muted-foreground">{freebie.total_claims} claimed</div>
          </div>
        </div>

        {canClaim() && !isExpired ? (
          <Button className="w-full bg-green-500 hover:bg-green-600 text-white" onClick={() => onClaim(freebie)}>
            <Gift className="h-4 w-4 mr-2" />
            Claim Free Item
          </Button>
        ) : (
          <Button disabled className="w-full">
            {isExpired
              ? "Expired"
              : freebie.stock_quantity <= 0
                ? "Out of Stock"
                : !profile
                  ? "Login Required"
                  : `${freebie.required_tier.toUpperCase()}+ Only`}
          </Button>
        )}

        {freebie.expires_at && !isExpired && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Expires: {new Date(freebie.expires_at).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default function MerchPage() {
  const { profile } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [freebies, setFreebies] = useState<FreebieItem[]>([])
  const [loadingFreebies, setLoadingFreebies] = useState(true)
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)
  const [selectedFreebie, setSelectedFreebie] = useState<FreebieItem | null>(null)
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
  })
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

  useEffect(() => {
    fetchFreebies()
  }, [profile])

  const fetchFreebies = async () => {
    try {
      setLoadingFreebies(true)
      const response = await fetch(`/api/freebies?tier=${profile?.tier || "grassroot"}`)
      const data = await response.json()

      if (data.success) {
        setFreebies(data.freebies)
      } else {
        toast.error("Failed to load freebies")
      }
    } catch (error) {
      console.error("Error fetching freebies:", error)
      toast.error("Failed to load freebies")
    } finally {
      setLoadingFreebies(false)
    }
  }

  const filteredProducts =
    selectedCategory === "all" ? products : products.filter((product) => product.category === selectedCategory)

  const filteredFreebies =
    selectedCategory === "all" ? freebies : freebies.filter((freebie) => freebie.category === selectedCategory)

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

    toast.success(`${product.name} (${size}) added to cart!`)
  }

  const handleClaimFreebie = (freebie: FreebieItem) => {
    setSelectedFreebie(freebie)
    setClaimDialogOpen(true)
  }

  const submitClaim = async () => {
    if (!selectedFreebie || !profile) return

    try {
      const response = await fetch("/api/freebies/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          freebieId: selectedFreebie.id,
          shippingAddress,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Freebie claimed successfully! We'll process your request soon.")
        setClaimDialogOpen(false)
        setSelectedFreebie(null)
        setShippingAddress({
          fullName: "",
          address: "",
          city: "",
          state: "",
          postalCode: "",
          phone: "",
        })
        fetchFreebies() // Refresh freebies list
      } else {
        toast.error(data.error || "Failed to claim freebie")
      }
    } catch (error) {
      console.error("Error claiming freebie:", error)
      toast.error("Failed to claim freebie")
    }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="font-street text-4xl md:text-6xl text-gradient mb-2">MERCH STORE</h1>
            <p className="text-muted-foreground">Official Erigga merchandise and exclusive freebies</p>
          </div>

          <div className="flex items-center gap-4">
            {profile && <CoinBalance size="md" />}
            <Button variant="outline" className="relative bg-transparent">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </Button>
          </div>
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

        {/* Main Content Tabs */}
        <Tabs defaultValue="merchandise" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card/50 border border-orange-500/20 mb-8">
            <TabsTrigger
              value="merchandise"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-black"
            >
              <Package className="h-4 w-4 mr-2" />
              Merchandise
            </TabsTrigger>
            <TabsTrigger value="freebies" className="data-[state=active]:bg-green-500 data-[state=active]:text-black">
              <Gift className="h-4 w-4 mr-2" />
              Freebies
            </TabsTrigger>
          </TabsList>

          {/* Merchandise Tab */}
          <TabsContent value="merchandise">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </TabsContent>

          {/* Freebies Tab */}
          <TabsContent value="freebies">
            {loadingFreebies ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-64 bg-muted"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded mb-4"></div>
                      <div className="h-10 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredFreebies.map((freebie) => (
                  <FreebieCard key={freebie.id} freebie={freebie} onClaim={handleClaimFreebie} />
                ))}
              </div>
            )}

            {!loadingFreebies && filteredFreebies.length === 0 && (
              <div className="text-center py-12">
                <Gift className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No freebies available</h3>
                <p className="text-muted-foreground">Check back later for new free items!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Claim Freebie Dialog */}
        <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Claim Free Item</DialogTitle>
              <DialogDescription>
                Please provide your shipping address to claim {selectedFreebie?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={shippingAddress.fullName}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={shippingAddress.address}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your full address"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress((prev) => ({ ...prev, state: e.target.value }))}
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={shippingAddress.postalCode}
                    onChange={(e) => setShippingAddress((prev) => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="Postal code"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  onClick={submitClaim}
                  disabled={!shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city}
                >
                  Claim Item
                </Button>

                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setClaimDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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

          <Card className="bg-card/50 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-green-500" />
                Free Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Claim exclusive freebies based on your membership tier. Higher tiers get access to more premium free
                items.
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
        </div>
      </div>
    </div>
  )
}
