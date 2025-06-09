"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShoppingBag, Star, Crown, Filter, Plus, Minus, Heart } from "lucide-react"

// Mock products data
const products = [
  {
    id: "1",
    name: "Paper Boi Hoodie",
    description: "Premium quality hoodie with Erigga's signature Paper Boi design. Made from 100% cotton.",
    price: 1500000, // 15000 NGN in kobo
    originalPrice: 2000000,
    images: ["/placeholder.svg?height=400&width=400", "/placeholder.svg?height=400&width=400"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "Hoodies",
    isPremiumOnly: false,
    stockQuantity: 50,
    rating: 4.8,
    reviews: 124,
    isNew: true,
    isBestseller: true,
  },
  {
    id: "2",
    name: "Warri Elite T-Shirt",
    description: "Exclusive t-shirt for Warri Elite members. Features gold foil print and premium fabric.",
    price: 800000, // 8000 NGN in kobo
    images: ["/placeholder.svg?height=400&width=400", "/placeholder.svg?height=400&width=400"],
    sizes: ["S", "M", "L", "XL"],
    category: "T-Shirts",
    isPremiumOnly: true,
    requiredTier: "warri_elite",
    stockQuantity: 30,
    rating: 4.9,
    reviews: 89,
    isNew: false,
    isBestseller: false,
  },
  {
    id: "3",
    name: "Street Made Cap",
    description: "Snapback cap with embroidered Erigga logo. Perfect for any street outfit.",
    price: 500000, // 5000 NGN in kobo
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["One Size"],
    category: "Accessories",
    isPremiumOnly: false,
    stockQuantity: 100,
    rating: 4.6,
    reviews: 67,
    isNew: false,
    isBestseller: true,
  },
  {
    id: "4",
    name: "Erigma Circle Jacket",
    description:
      "Limited edition leather jacket exclusively for Erigma Circle members. Hand-crafted with premium materials.",
    price: 5000000, // 50000 NGN in kobo
    images: ["/placeholder.svg?height=400&width=400", "/placeholder.svg?height=400&width=400"],
    sizes: ["M", "L", "XL"],
    category: "Jackets",
    isPremiumOnly: true,
    requiredTier: "erigma_circle",
    stockQuantity: 10,
    rating: 5.0,
    reviews: 15,
    isNew: true,
    isBestseller: false,
  },
  {
    id: "5",
    name: "Paper Boi Joggers",
    description: "Comfortable joggers with side stripe design. Perfect for casual wear.",
    price: 1200000, // 12000 NGN in kobo
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["S", "M", "L", "XL"],
    category: "Bottoms",
    isPremiumOnly: false,
    stockQuantity: 40,
    rating: 4.7,
    reviews: 92,
    isNew: false,
    isBestseller: false,
  },
  {
    id: "6",
    name: "Trenches Vinyl Record",
    description: "Limited edition vinyl record featuring Erigga's greatest hits. Collector's item.",
    price: 2500000, // 25000 NGN in kobo
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["One Size"],
    category: "Music",
    isPremiumOnly: true,
    requiredTier: "warri_elite",
    stockQuantity: 25,
    rating: 4.9,
    reviews: 34,
    isNew: true,
    isBestseller: false,
  },
]

// Mock cart state
const initialCartState: Array<{
  productId: string
  size: string
  quantity: number
}> = []
export default function MerchPage() {
  const [cart, setCart] = useState(initialCartState)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedFilter, setSelectedFilter] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<(typeof products)[0] | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [quantity, setQuantity] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)

  // Mock user tier (this would come from auth context)
  const userTier = "warri_elite" // street_rep, warri_elite, erigma_circle

  const categories = ["all", "Hoodies", "T-Shirts", "Accessories", "Jackets", "Bottoms", "Music"]
  const filters = ["all", "premium", "bestsellers", "new"]

  const formatPrice = (priceInKobo: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(priceInKobo / 100)
  }

  const canAccessProduct = (product: (typeof products)[0]) => {
    if (!product.isPremiumOnly) return true

    const tierHierarchy = {
      street_rep: 0,
      warri_elite: 1,
      erigma_circle: 2,
    }

    const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy]
    const requiredTierLevel = tierHierarchy[product.requiredTier as keyof typeof tierHierarchy]

    return userTierLevel >= requiredTierLevel
  }

  const filteredProducts = products.filter((product) => {
    const categoryMatch = selectedCategory === "all" || product.category === selectedCategory

    let filterMatch = true
    if (selectedFilter === "premium") filterMatch = product.isPremiumOnly
    if (selectedFilter === "bestsellers") filterMatch = product.isBestseller
    if (selectedFilter === "new") filterMatch = product.isNew

    return categoryMatch && filterMatch
  })

  const handleAddToCart = (product: (typeof products)[0]) => {
    if (!selectedSize && product.sizes.length > 1) {
      alert("Please select a size")
      return
    }

    const size = selectedSize || product.sizes[0]
    setCart((prev) => [...prev, { productId: product.id, size, quantity }])
    alert("Added to cart!")
  }

  const handlePurchase = async (product: (typeof products)[0]) => {
    if (!canAccessProduct(product)) {
      alert("This item requires a higher tier membership")
      return
    }

    setIsProcessing(true)

    try {
      const handler = (window as any).PaystackPop.setup({
        key: "pk_test_0123456789abcdef0123456789abcdef01234567", // Paystack test public key
        email: "user@example.com",
        amount: product.price * quantity,
        currency: "NGN",
        ref: `merch_${product.id}_${Date.now()}`,
        metadata: {
          product_id: product.id,
          product_name: product.name,
          size: selectedSize || product.sizes[0],
          quantity: quantity,
        },
        callback: (response: any) => {
          console.log("Payment successful:", response)
          alert(`Payment successful! Reference: ${response.reference}`)
          // Here you would typically call your backend to process the order
        },
        onClose: () => {
          console.log("Payment window closed")
        },
      })

      handler.openIframe()
    } catch (error) {
      console.error("Payment error:", error)
      alert("Payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-street text-4xl md:text-6xl text-gradient mb-4">MERCH STORE</h1>
          <p className="text-xl text-muted-foreground">Street wear that speaks your language. Rep the culture.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-orange-500" />
            <span className="font-medium">Filters:</span>
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              {filters.map((filter) => (
                <SelectItem key={filter} value={filter}>
                  {filter === "all"
                    ? "All Items"
                    : filter === "premium"
                      ? "Premium Only"
                      : filter === "bestsellers"
                        ? "Best Sellers"
                        : "New Items"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const isAccessible = canAccessProduct(product)

            return (
              <Card
                key={product.id}
                className={`bg-card/50 border-orange-500/20 hover:border-orange-500/40 transition-all group ${!isAccessible ? "opacity-60" : ""}`}
              >
                <CardHeader className="p-0">
                  <div className="relative">
                    <img
                      src={product.images[0] || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-64 object-cover rounded-t-lg"
                    />

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.isNew && <Badge className="bg-green-500 text-white">NEW</Badge>}
                      {product.isBestseller && <Badge className="bg-orange-500 text-black">BESTSELLER</Badge>}
                      {product.isPremiumOnly && (
                        <Badge className="bg-gold-400 text-black flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          PREMIUM
                        </Badge>
                      )}
                    </div>

                    {/* Wishlist */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>

                    {!isAccessible && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
                        <div className="text-center text-white">
                          <Crown className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm font-medium">Requires Higher Tier</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < Math.floor(product.rating) ? "fill-orange-500 text-orange-500" : "text-gray-400"}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">({product.reviews})</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-orange-500">{formatPrice(product.price)}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>

                    {/* Stock */}
                    <div className="text-xs text-muted-foreground">
                      {product.stockQuantity > 0 ? (
                        `${product.stockQuantity} in stock`
                      ) : (
                        <span className="text-red-500">Out of stock</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-black"
                            disabled={!isAccessible || product.stockQuantity === 0}
                            onClick={() => setSelectedProduct(product)}
                          >
                            {!isAccessible ? "Locked" : "Buy Now"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Purchase Item</DialogTitle>
                          </DialogHeader>
                          {selectedProduct && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <img
                                  src={selectedProduct.images[0] || "/placeholder.svg"}
                                  alt={selectedProduct.name}
                                  className="w-full h-64 object-cover rounded-lg"
                                />
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
                                  <p className="text-muted-foreground">{selectedProduct.description}</p>
                                </div>

                                <div className="text-2xl font-bold text-orange-500">
                                  {formatPrice(selectedProduct.price)}
                                </div>

                                {selectedProduct.sizes.length > 1 && (
                                  <div>
                                    <Label>Size</Label>
                                    <Select value={selectedSize} onValueChange={setSelectedSize}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select size" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {selectedProduct.sizes.map((size) => (
                                          <SelectItem key={size} value={size}>
                                            {size}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                <div>
                                  <Label>Quantity</Label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <Input
                                      type="number"
                                      value={quantity}
                                      onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                                      className="w-20 text-center"
                                    />
                                    <Button size="icon" variant="outline" onClick={() => setQuantity(quantity + 1)}>
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="bg-orange-500/10 p-4 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span>Total:</span>
                                    <span className="text-xl font-bold text-orange-500">
                                      {formatPrice(selectedProduct.price * quantity)}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-black"
                                    onClick={() => handlePurchase(selectedProduct)}
                                    disabled={isProcessing}
                                  >
                                    {isProcessing ? "Processing..." : "Pay with Paystack"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleAddToCart(selectedProduct)}
                                    className="border-gold-400 text-gold-400"
                                  >
                                    <ShoppingBag className="h-4 w-4 mr-1" />
                                    Add to Cart
                                  </Button>
                                </div>

                                <p className="text-xs text-muted-foreground">
                                  Secure payment powered by Paystack. Free shipping on orders over ₦20,000.
                                </p>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your filters to see more items.</p>
          </div>
        )}
      </div>

      {/* Paystack Script */}
      <script src="https://js.paystack.co/v1/inline.js"></script>
    </div>
  )
}
