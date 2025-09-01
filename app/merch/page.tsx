"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ShoppingCart, Heart, Star, Coins, CreditCard, Minus, Plus, Truck, RotateCcw } from "lucide-react"
import { CoinBalance } from "@/components/coin-balance"
import { PaystackIntegration } from "@/components/paystack/paystack-integration"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"

const products = [
  {
    id: 1,
    name: "G.O.A.T Blue T-Shirt",
    description: "Light blue premium t-shirt featuring Erigga and crew with bold G.O.A.T branding",
    price: 80000,
    coin_price: 8000,
    images: {
      front: "/merch/blue-goat-front.png",
      back: "/merch/blue-goat-back.png",
    },
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "clothing",
    is_premium_only: false,
    stock_quantity: 0,
    rating: 4.9,
    reviews: 89,
    status: "preorder",
  },
  {
    id: 2,
    name: "G.O.A.T Black T-Shirt",
    description: "Classic black t-shirt with gold Erigga G.O.A.T design and group photo",
    price: 80000,
    coin_price: 8000,
    images: {
      front: "/merch/black-goat-front.png",
      back: "/merch/love-message-back.png",
    },
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "clothing",
    is_premium_only: false,
    stock_quantity: 0,
    rating: 4.8,
    reviews: 124,
    status: "preorder",
  },
  {
    id: 3,
    name: "G.O.A.T Black Tank Top",
    description: "Premium black tank top with gold Erigga G.O.A.T branding",
    price: 80000,
    coin_price: 8000,
    images: {
      front: "/merch/black-tank-goat-front.png",
      back: "/merch/black-tank-back.png",
    },
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "clothing",
    is_premium_only: false,
    stock_quantity: 0,
    rating: 4.7,
    reviews: 67,
    status: "preorder",
  },
  {
    id: 4,
    name: "Erigga Portrait Tank Top",
    description: "Artistic black tank top with distressed Erigga portrait design",
    price: 80000,
    coin_price: 8000,
    images: {
      front: "/merch/black-tank-erigga-front.png",
      back: "/merch/around9-tank-back.png",
    },
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "clothing",
    is_premium_only: false,
    stock_quantity: 0,
    rating: 4.8,
    reviews: 45,
    status: "preorder",
  },
  {
    id: 5,
    name: "Crown Design T-Shirt",
    description: "Black t-shirt with artistic crown design and inspirational message",
    price: 80000,
    coin_price: 8000,
    images: {
      front: "/merch/crown-design-front.png",
      back: "/merch/plain-black-back.png",
    },
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "clothing",
    is_premium_only: false,
    stock_quantity: 0,
    rating: 4.6,
    reviews: 78,
    status: "preorder",
  },
  {
    id: 6,
    name: "G.O.A.T Tank Top Collection",
    description: "Premium quality tank top featuring the complete G.O.A.T album tracklist",
    price: 80000,
    coin_price: 8000,
    images: {
      front: "/merch/tank-front.png",
      back: "/merch/tank-back.png",
    },
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "clothing",
    is_premium_only: false,
    stock_quantity: 0,
    rating: 4.9,
    reviews: 92,
    status: "preorder",
  },
  {
    id: 7,
    name: "G.O.A.T T-Shirt Collection",
    description: "Comfortable cotton t-shirt with Erigga Live branding and full tracklist",
    price: 80000,
    coin_price: 8000,
    images: {
      front: "/merch/tshirt-front.png",
      back: "/merch/tshirt-back.png",
    },
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "clothing",
    is_premium_only: false,
    stock_quantity: 0,
    rating: 4.8,
    reviews: 156,
    status: "preorder",
  },
  {
    id: 8,
    name: "Erigga Signature Cap",
    description: "Premium adjustable cap with embroidered logo",
    price: 45000,
    coin_price: 4500,
    images: {
      front: "/placeholder.svg?height=400&width=400&text=Cap",
      back: "/placeholder.svg?height=400&width=400&text=Cap",
    },
    sizes: ["One Size"],
    category: "accessories",
    is_premium_only: false,
    stock_quantity: 0,
    rating: 0,
    reviews: 0,
    status: "out_of_stock",
  },
  {
    id: 9,
    name: "Limited Edition Vinyl",
    description: "Exclusive G.O.A.T album vinyl record",
    price: 150000,
    coin_price: 15000,
    images: {
      front: "/placeholder.svg?height=400&width=400&text=Vinyl",
      back: "/placeholder.svg?height=400&width=400&text=Vinyl",
    },
    sizes: ["Standard"],
    category: "collectibles",
    is_premium_only: true,
    required_tier: "enterprise",
    stock_quantity: 0,
    rating: 0,
    reviews: 0,
    status: "out_of_stock",
  },
]

interface CartItem {
  product: (typeof products)[0]
  size: string
  paymentMethod: "cash" | "coins"
  quantity: number
}

interface DeliveryAddress {
  fullName: string
  phone: string
  address: string
  city: string
  state: string
  postalCode: string
}

function ProductCard({
  product,
  onAddToCart,
  onPaystackPreorder,
  preorderPrice,
}: {
  product: (typeof products)[0]
  onAddToCart: (product: (typeof products)[0], size: string, paymentMethod: "cash" | "coins") => void
  onPaystackPreorder?: (itemId: string, itemName: string) => void
  preorderPrice?: number
}) {
  const { profile } = useAuth()
  const [selectedSize, setSelectedSize] = useState(product.sizes[0])
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "coins">("cash")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)

  const canPurchase = () => {
    if (product.status === "out_of_stock") return false

    if (product.is_premium_only && product.required_tier) {
      if (!profile) return false
      return profile.tier === product.required_tier || profile.tier === "enterprise"
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
    <Card className="group hover:shadow-xl transition-all duration-500 bg-card/50 border-orange-500/20 overflow-hidden">
      <div
        className={`flip-card h-80 cursor-pointer ${isFlipped ? "flipped" : ""}`}
        onClick={() => product.images.front !== product.images.back && setIsFlipped(!isFlipped)}
      >
        <div className="flip-card-inner">
          {/* Front */}
          <div className="flip-card-front">
            <img
              src={product.images.front || "/placeholder.svg"}
              alt={`${product.name} - Front`}
              className={`w-full h-full object-cover ${product.status === "out_of_stock" ? "blur-sm grayscale" : ""}`}
            />
            {product.images.front !== product.images.back && (
              <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                Flip
              </div>
            )}
          </div>

          {/* Back */}
          <div className="flip-card-back">
            <img
              src={product.images.back || "/placeholder.svg"}
              alt={`${product.name} - Back`}
              className={`w-full h-full object-cover ${product.status === "out_of_stock" ? "blur-sm grayscale" : ""}`}
            />
            {product.images.front !== product.images.back && (
              <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                Flip
              </div>
            )}
          </div>
        </div>

        {/* Status badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
          {product.status === "preorder" && <Badge className="bg-blue-500 text-white">PREORDER</Badge>}
          {product.status === "out_of_stock" && <Badge className="bg-gray-500 text-white">OUT OF STOCK</Badge>}
          {product.is_premium_only && (
            <Badge className="bg-red-500 text-white">{product.required_tier?.toUpperCase()} Only</Badge>
          )}
        </div>

        <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-white/80 hover:bg-white z-10">
          <Heart className="h-4 w-4" />
        </Button>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg group-hover:text-orange-500 transition-colors">{product.name}</h3>
          {product.status !== "out_of_stock" && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-muted-foreground">{product.rating}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            {preorderPrice ? (
              <>
                <div className="font-bold text-lg">₦{preorderPrice.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground line-through">₦{product.price.toLocaleString()}</div>
              </>
            ) : (
              <>
                <div className="font-bold text-lg">₦{product.price.toLocaleString()}</div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Coins className="h-3 w-3 text-yellow-500 mr-1" />
                  {product.coin_price.toLocaleString()} coins
                </div>
              </>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {product.status === "preorder"
              ? "Preorder"
              : product.status === "out_of_stock"
                ? "Out of Stock"
                : `${product.stock_quantity} in stock`}
          </Badge>
        </div>

        {canPurchase() ? (
          <div className="space-y-2">
            {onPaystackPreorder && preorderPrice && (
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white merch-button"
                onClick={() => onPaystackPreorder(product.id.toString(), product.name)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Buy Preorder (₦{preorderPrice.toLocaleString()})
              </Button>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-black merch-button">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.status === "preorder" ? "Preorder Now" : "Add to Cart"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md merch-dialog">
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
                      className="grid grid-cols-1 gap-3"
                    >
                      <div
                        className={`border rounded-lg p-4 cursor-pointer ${paymentMethod === "cash" ? "border-orange-500 bg-orange-500/10" : ""}`}
                      >
                        <RadioGroupItem value="cash" id="cash" className="sr-only" />
                        <Label htmlFor="cash" className="flex items-center cursor-pointer">
                          <CreditCard className="h-5 w-5 mr-3" />
                          <div>
                            <div className="font-medium">Paystack Payment</div>
                            <div className="text-sm text-muted-foreground">₦{product.price.toLocaleString()}</div>
                          </div>
                        </Label>
                      </div>

                      <div
                        className={`border rounded-lg p-4 cursor-pointer ${paymentMethod === "coins" ? "border-orange-500 bg-orange-500/10" : ""}`}
                      >
                        <RadioGroupItem value="coins" id="coins" className="sr-only" />
                        <Label htmlFor="coins" className="flex items-center cursor-pointer">
                          <Coins className="h-5 w-5 mr-3 text-yellow-500" />
                          <div>
                            <div className="font-medium">Erigga Coins</div>
                            <div className="text-sm text-muted-foreground">
                              {product.coin_price.toLocaleString()} coins
                            </div>
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
                            {profile.coins.toLocaleString()} coins
                          </div>
                        </div>
                        {profile.coins < product.coin_price && (
                          <p className="text-xs text-red-500 mt-1">
                            Insufficient coins. You need {(product.coin_price - profile.coins).toLocaleString()} more
                            coins.
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
          </div>
        ) : (
          <Button disabled className="w-full merch-button">
            {product.status === "out_of_stock"
              ? "Out of Stock"
              : `${product.required_tier?.toUpperCase()} Members Only`}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function MerchPage() {
  const { user, profile, loading } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
  })

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

    alert(`${product.name} (${size}) added to cart!`)
  }

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart((prev) => prev.filter((_, i) => i !== index))
    } else {
      setCart((prev) => prev.map((item, i) => (i === index ? { ...item, quantity: newQuantity } : item)))
    }
  }

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const price = item.paymentMethod === "coins" ? item.product.coin_price : item.product.price
      return total + price * item.quantity
    }, 0)
  }

  const getTotalCoins = () => {
    return cart
      .filter((item) => item.paymentMethod === "coins")
      .reduce((total, item) => {
        return total + item.product.coin_price * item.quantity
      }, 0)
  }

  const getTotalCash = () => {
    return cart
      .filter((item) => item.paymentMethod === "cash")
      .reduce((total, item) => {
        return total + item.product.price * item.quantity
      }, 0)
  }

  const handlePaystackSuccess = (reference: string) => {
    console.log("[v0] Payment successful:", reference)
    alert(
      "🎉 Payment successful! Your G.O.A.T merchandise order has been placed. You'll receive a confirmation email shortly.",
    )
    setCart([])
    setIsCheckoutOpen(false)
    setIsCartOpen(false)
  }

  const handlePaystackError = (error: string) => {
    console.error("[v0] Payment error:", error)
    alert(`❌ Payment failed: ${error}. Please try again or contact support if the issue persists.`)
  }

  const handleCoinPayment = async () => {
    const totalCoins = getTotalCoins()
    if (profile && profile.coins >= totalCoins) {
      console.log("[v0] Processing coin payment for:", totalCoins, "coins")
      alert("🪙 Coin payment successful! Your G.O.A.T merchandise order has been placed.")
      setCart([])
      setIsCheckoutOpen(false)
      setIsCartOpen(false)
    } else {
      alert("❌ Insufficient coins! Please purchase more coins or pay with cash.")
    }
  }

  const paystackMerchEnabled = process.env.NEXT_PUBLIC_FEATURE_PAYSTACK_MERCH === "true"
  const merchPreorderPrice = Number(process.env.NEXT_PUBLIC_MERCH_PREORDER_PRICE) || 80000

  const handlePaystackPreorder = async (itemId: string, itemName: string) => {
    if (!user || !paystackMerchEnabled) return

    try {
      const response = await fetch("/api/merch/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          itemName,
          deliveryAddress,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Checkout failed")
      }

      // Redirect to Paystack
      window.location.href = data.authorization_url
    } catch (error: any) {
      console.error("Preorder error:", error)
      alert(`Preorder failed: ${error.message}`)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please log in to view the merch store.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="font-street text-4xl md:text-6xl text-gradient mb-2">G.O.A.T MERCH</h1>
            <p className="text-muted-foreground">
              Official Erigga G.O.A.T collection - All items available for preorder
            </p>
            {paystackMerchEnabled && (
              <p className="text-sm text-orange-500 mt-2">
                🔥 Fixed preorder price: ₦{merchPreorderPrice.toLocaleString()} for all items
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            {profile && <CoinBalance size="md" />}
            <Button variant="outline" className="relative bg-transparent" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
              {cart.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-orange-500 text-black">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </Badge>
              )}
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

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onPaystackPreorder={paystackMerchEnabled ? handlePaystackPreorder : undefined}
              preorderPrice={paystackMerchEnabled ? merchPreorderPrice : undefined}
            />
          ))}
        </div>

        {/* Cart Dialog */}
        <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto merch-dialog">
            <DialogHeader>
              <DialogTitle>Shopping Cart</DialogTitle>
              <DialogDescription>Review your items before checkout</DialogDescription>
            </DialogHeader>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg cart-item">
                    <img
                      src={item.product.images.front || "/placeholder.svg"}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded cart-item-image"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product.name}</h4>
                      <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                      <p className="text-sm text-muted-foreground">
                        Payment: {item.paymentMethod === "coins" ? "Erigga Coins" : "Cash"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right cart-controls">
                      <p className="font-medium">
                        {item.paymentMethod === "coins"
                          ? `${(item.product.coin_price * item.quantity).toLocaleString()} coins`
                          : `₦${(item.product.price * item.quantity).toLocaleString()}`}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removeFromCart(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  {getTotalCash() > 0 && (
                    <div className="flex justify-between">
                      <span>Cash Total:</span>
                      <span className="font-medium">₦{getTotalCash().toLocaleString()}</span>
                    </div>
                  )}
                  {getTotalCoins() > 0 && (
                    <div className="flex justify-between">
                      <span>Coins Total:</span>
                      <span className="font-medium">{getTotalCoins().toLocaleString()} coins</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setIsCartOpen(false)}>
                    Continue Shopping
                  </Button>
                  <Button
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-black"
                    onClick={() => {
                      setIsCartOpen(false)
                      setIsCheckoutOpen(true)
                    }}
                  >
                    Checkout
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Checkout Dialog */}
        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Checkout</DialogTitle>
              <DialogDescription>Complete your order</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Delivery Address */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Delivery Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={deliveryAddress.fullName}
                      onChange={(e) => setDeliveryAddress((prev) => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter your full name"
                      className="touch-manipulation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={deliveryAddress.phone}
                      onChange={(e) => setDeliveryAddress((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                      className="touch-manipulation"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={deliveryAddress.address}
                    onChange={(e) => setDeliveryAddress((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter your full address"
                    rows={3}
                    className="touch-manipulation"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                      className="touch-manipulation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={deliveryAddress.state}
                      onChange={(e) => setDeliveryAddress((prev) => ({ ...prev, state: e.target.value }))}
                      placeholder="State"
                      className="touch-manipulation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={deliveryAddress.postalCode}
                      onChange={(e) => setDeliveryAddress((prev) => ({ ...prev, postalCode: e.target.value }))}
                      placeholder="Postal Code"
                      className="touch-manipulation"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Order Summary */}
              <div className="space-y-4">
                <h3 className="font-medium">Order Summary</h3>
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.product.name} ({item.size}) x{item.quantity}
                    </span>
                    <span>
                      {item.paymentMethod === "coins"
                        ? `${(item.product.coin_price * item.quantity).toLocaleString()} coins`
                        : `₦${(item.product.price * item.quantity).toLocaleString()}`}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="space-y-2">
                  {getTotalCash() > 0 && (
                    <div className="flex justify-between font-medium">
                      <span>Cash Payment:</span>
                      <span>₦{getTotalCash().toLocaleString()}</span>
                    </div>
                  )}
                  {getTotalCoins() > 0 && (
                    <div className="flex justify-between font-medium">
                      <span>Coin Payment:</span>
                      <span>{getTotalCoins().toLocaleString()} coins</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Payment Buttons */}
              <div className="space-y-4">
                {getTotalCash() > 0 && (
                  <PaystackIntegration
                    amount={getTotalCash()}
                    email={user?.email || ""}
                    metadata={{
                      cart: JSON.stringify(cart.filter((item) => item.paymentMethod === "cash")),
                      delivery_address: JSON.stringify(deliveryAddress),
                      user_id: user?.id,
                      order_type: "merch_preorder",
                    }}
                    onSuccess={(reference) => {
                      console.log("[v0] Paystack payment successful:", reference)
                      handlePaystackSuccess(reference)
                    }}
                    onError={(error) => {
                      console.log("[v0] Paystack payment error:", error)
                      handlePaystackError(error)
                    }}
                    className="w-full"
                  >
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white min-h-[44px]">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay ₦{getTotalCash().toLocaleString()} with Paystack
                    </Button>
                  </PaystackIntegration>
                )}

                {getTotalCoins() > 0 && (
                  <Button
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white min-h-[44px]"
                    onClick={handleCoinPayment}
                    disabled={!profile || profile.coins < getTotalCoins()}
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    Pay {getTotalCoins().toLocaleString()} Erigga Coins
                    {profile && profile.coins < getTotalCoins() && " (Insufficient Balance)"}
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full bg-transparent min-h-[44px]"
                  onClick={() => setIsCheckoutOpen(false)}
                >
                  Back to Cart
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

          <Card className="bg-card/50 border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Preorder Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All G.O.A.T merchandise is currently available for preorder. Items will be shipped within 2-3 weeks
                after order confirmation.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-orange-500/20">
            <CardHeader>
              <CardTitle>Secure Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All payments are processed securely through Paystack. We accept all major cards and bank transfers
                within Nigeria.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx>{`
        .flip-card {
          perspective: 1000px;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
        }
        .flip-card-front {
          z-index: 2;
        }
        .flip-card-back {
          transform: rotateY(180deg);
        }
        .flipped .flip-card-inner {
          transform: rotateY(180deg);
        }
        .merch-button {
          /* Additional styles for buttons */
        }
        .merch-dialog {
          /* Additional styles for dialogs */
        }
        .merch-grid {
          /* Additional styles for grid */
        }
        .cart-item {
          /* Additional styles for cart items */
        }
        .cart-item-image {
          /* Additional styles for cart item images */
        }
        .cart-controls {
          /* Additional styles for cart controls */
        }
        .checkout-form {
          /* Additional styles for checkout form */
        }
      `}</style>
    </div>
  )
}
