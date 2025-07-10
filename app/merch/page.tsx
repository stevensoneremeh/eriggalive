"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ShoppingCart, Star, Minus, Plus, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { PaystackCheckout } from "@/components/paystack-checkout"
import { useAuth } from "@/contexts/auth-context"

interface Product {
  id: string
  name: string
  description: string
  price: number
  coin_price: number
  images: string[]
  sizes: string[]
  category: string
  is_premium_only: boolean
  required_tier: string | null
  stock_quantity: number
  rating: number
  review_count: number
  is_active: boolean
}

interface CartItem {
  product: Product
  size: string
  quantity: number
  payment_method: "cash" | "coins"
}

// Sample products - used as fallback if API fails
const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Paper Boi Hoodie",
    description: "Premium quality hoodie with Erigga's signature Paper Boi design",
    price: 15000,
    coin_price: 1500,
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "clothing",
    is_premium_only: false,
    required_tier: null,
    stock_quantity: 25,
    rating: 4.8,
    review_count: 124,
    is_active: true,
  },
  {
    id: "2",
    name: "Warri Vibe T-Shirt",
    description: "Comfortable cotton t-shirt representing Warri culture",
    price: 8000,
    coin_price: 800,
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["S", "M", "L", "XL"],
    category: "clothing",
    is_premium_only: false,
    required_tier: null,
    stock_quantity: 50,
    rating: 4.6,
    review_count: 89,
    is_active: true,
  },
  {
    id: "3",
    name: "Erigga Signature Cap",
    description: "Adjustable cap with embroidered Erigga logo",
    price: 5000,
    coin_price: 500,
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["One Size"],
    category: "accessories",
    is_premium_only: false,
    required_tier: null,
    stock_quantity: 75,
    rating: 4.7,
    review_count: 156,
    is_active: true,
  },
  {
    id: "4",
    name: "Limited Edition Vinyl Record",
    description: "Exclusive vinyl record of 'The Erigma' album – Blood tier exclusive",
    price: 25000,
    coin_price: 2500,
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["Standard"],
    category: "collectibles",
    is_premium_only: true,
    required_tier: "blood",
    stock_quantity: 10,
    rating: 5.0,
    review_count: 23,
    is_active: true,
  },
  {
    id: "5",
    name: "Street Chronicles Poster Set",
    description: "Set of 3 high-quality posters from different eras",
    price: 3000,
    coin_price: 300,
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["A2"],
    category: "collectibles",
    is_premium_only: false,
    required_tier: null,
    stock_quantity: 100,
    rating: 4.5,
    review_count: 67,
    is_active: true,
  },
  {
    id: "6",
    name: "Erigga Phone Case",
    description: "Protective phone case with custom Erigga artwork",
    price: 4500,
    coin_price: 450,
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["iPhone 14", "iPhone 15", "Samsung S23", "Samsung S24"],
    category: "accessories",
    is_premium_only: false,
    required_tier: null,
    stock_quantity: 40,
    rating: 4.4,
    review_count: 78,
    is_active: true,
  },
]

export default function MerchPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showCheckout, setShowCheckout] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("erigga-cart")
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error("Error loading cart:", error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("erigga-cart", JSON.stringify(cart))
  }, [cart])

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/merch/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      } else {
        console.error("Failed to fetch products")
        setProducts(SAMPLE_PRODUCTS)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      setProducts(SAMPLE_PRODUCTS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Check if user can access premium products
  const canAccessProduct = (product: Product) => {
    if (!product.is_premium_only) return true
    if (!user) return false
    if (product.required_tier === "blood" && user.tier === "blood") return true
    return false
  }

  // Add item to cart
  const addToCart = (product: Product, size: string, paymentMethod: "cash" | "coins") => {
    if (!canAccessProduct(product)) {
      toast({
        title: "Access Denied",
        description: `This item requires ${product.required_tier} tier membership.`,
        variant: "destructive",
      })
      return
    }

    const existingItemIndex = cart.findIndex(
      (item) => item.product.id === product.id && item.size === size && item.payment_method === paymentMethod,
    )

    if (existingItemIndex > -1) {
      const newCart = [...cart]
      newCart[existingItemIndex].quantity += 1
      setCart(newCart)
    } else {
      setCart([...cart, { product, size, quantity: 1, payment_method: paymentMethod }])
    }

    toast({
      title: "Added to Cart",
      description: `${product.name} (${size}) added to your cart.`,
    })
  }

  // Update cart item quantity
  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index)
      return
    }

    const newCart = [...cart]
    newCart[index].quantity = newQuantity
    setCart(newCart)
  }

  // Remove item from cart
  const removeFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index)
    setCart(newCart)
    toast({
      title: "Removed from Cart",
      description: "Item removed from your cart.",
    })
  }

  // Calculate cart totals
  const cartTotals = cart.reduce(
    (totals, item) => {
      const itemTotal =
        item.payment_method === "cash" ? item.product.price * item.quantity : item.product.coin_price * item.quantity

      if (item.payment_method === "cash") {
        totals.cashTotal += itemTotal
      } else {
        totals.coinTotal += itemTotal
      }

      return totals
    },
    { cashTotal: 0, coinTotal: 0 },
  )

  const categories = ["all", "clothing", "accessories", "collectibles"]

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading merch store...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Erigga Merch Store</h1>
            <p className="text-gray-400">Official merchandise from the Paper Boi himself</p>
          </div>

          {/* Cart Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative bg-transparent">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart ({cart.length})
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-green-500">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-black border-gray-800 text-white w-full sm:max-w-lg">
              <SheetHeader>
                <SheetTitle className="text-white">Shopping Cart</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {cart.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Your cart is empty</p>
                ) : (
                  <>
                    {cart.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 border border-gray-800 rounded-lg">
                        <img
                          src={item.product.images[0] || "/placeholder.svg"}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.product.name}</h4>
                          <p className="text-sm text-gray-400">Size: {item.size}</p>
                          <p className="text-sm text-gray-400">
                            Payment: {item.payment_method === "cash" ? "Cash" : "Coins"}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {item.payment_method === "cash"
                              ? `₦${(item.product.price * item.quantity).toLocaleString()}`
                              : `${(item.product.coin_price * item.quantity).toLocaleString()} coins`}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Separator className="bg-gray-800" />

                    <div className="space-y-2">
                      {cartTotals.cashTotal > 0 && (
                        <div className="flex justify-between">
                          <span>Cash Total:</span>
                          <span className="font-semibold">₦{cartTotals.cashTotal.toLocaleString()}</span>
                        </div>
                      )}
                      {cartTotals.coinTotal > 0 && (
                        <div className="flex justify-between">
                          <span>Coin Total:</span>
                          <span className="font-semibold">{cartTotals.coinTotal.toLocaleString()} coins</span>
                        </div>
                      )}
                    </div>

                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setShowCheckout(true)}>
                      Proceed to Checkout
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48 bg-gray-900 border-gray-700 text-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              {categories.map((category) => (
                <SelectItem key={category} value={category} className="text-white">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={addToCart}
              canAccess={canAccessProduct(product)}
              user={user}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No products found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <PaystackCheckout
          cart={cart}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            setCart([])
            setShowCheckout(false)
            toast({
              title: "Order Successful!",
              description: "Your order has been placed successfully.",
            })
          }}
        />
      )}
    </div>
  )
}

// Product Card Component
function ProductCard({
  product,
  onAddToCart,
  canAccess,
  user,
}: {
  product: Product
  onAddToCart: (product: Product, size: string, paymentMethod: "cash" | "coins") => void
  canAccess: boolean
  user: any
}) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0])
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "coins">("cash")

  return (
    <Card className="bg-gray-900 border-gray-800 text-white overflow-hidden">
      <div className="relative">
        <img src={product.images[0] || "/placeholder.svg"} alt={product.name} className="w-full h-64 object-cover" />
        {product.is_premium_only && (
          <Badge className="absolute top-2 right-2 bg-red-600">{product.required_tier?.toUpperCase()} Only</Badge>
        )}
        {product.stock_quantity < 10 && <Badge className="absolute top-2 left-2 bg-orange-600">Low Stock</Badge>}
      </div>

      <CardHeader>
        <CardTitle className="text-lg">{product.name}</CardTitle>
        <p className="text-gray-400 text-sm">{product.description}</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="ml-1 text-sm">{product.rating}</span>
          </div>
          <span className="text-gray-400 text-sm">({product.review_count} reviews)</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xl font-bold">₦{product.price.toLocaleString()}</p>
            <p className="text-sm text-green-400">{product.coin_price.toLocaleString()} coins</p>
          </div>
          <Badge variant="outline" className="text-gray-400">
            {product.category}
          </Badge>
        </div>

        {canAccess ? (
          <>
            <div>
              <Label className="text-sm font-medium">Size</Label>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {product.sizes.map((size) => (
                    <SelectItem key={size} value={size} className="text-white">
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {user && (
              <div>
                <Label className="text-sm font-medium">Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={(value: "cash" | "coins") => setPaymentMethod(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash">Cash (₦{product.price.toLocaleString()})</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="coins" id="coins" />
                    <Label htmlFor="coins">Erigga Coins ({product.coin_price.toLocaleString()})</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-red-400 text-sm mb-2">Requires {product.required_tier?.toUpperCase()} tier membership</p>
            {!user && <p className="text-gray-400 text-xs">Sign in to purchase</p>}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          className="w-full bg-green-600 hover:bg-green-700"
          onClick={() => onAddToCart(product, selectedSize, paymentMethod)}
          disabled={!canAccess || product.stock_quantity === 0}
        >
          {product.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
      </CardFooter>
    </Card>
  )
}
