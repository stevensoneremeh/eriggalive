"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Star, Minus, Plus, Trash2 } from "lucide-react"
import { PaystackCheckout } from "@/components/paystack-checkout"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

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
  paymentMethod: "cash" | "coins"
}

export default function MerchPage() {
  const { user, userProfile } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  useEffect(() => {
    fetchProducts()
    loadCartFromStorage()
  }, [])

  useEffect(() => {
    saveCartToStorage()
  }, [cart])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/merch/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast.error("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  const loadCartFromStorage = () => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("erigga-cart")
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
    }
  }

  const saveCartToStorage = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("erigga-cart", JSON.stringify(cart))
    }
  }

  const addToCart = (product: Product, size: string, paymentMethod: "cash" | "coins") => {
    if (!user) {
      toast.error("Please sign in to add items to cart")
      return
    }

    // Check tier access for premium products
    if (product.is_premium_only && product.required_tier) {
      const tierOrder = ["grassroot", "pioneer", "elder", "blood"]
      const userTierIndex = tierOrder.indexOf(userProfile?.tier || "grassroot")
      const requiredTierIndex = tierOrder.indexOf(product.required_tier)

      if (userTierIndex < requiredTierIndex) {
        toast.error(`This item requires ${product.required_tier} tier or higher`)
        return
      }
    }

    // Check coin balance for coin payments
    if (paymentMethod === "coins" && (userProfile?.coins || 0) < product.coin_price) {
      toast.error("Insufficient Erigga Coins")
      return
    }

    const existingItemIndex = cart.findIndex(
      (item) => item.product.id === product.id && item.size === size && item.paymentMethod === paymentMethod,
    )

    if (existingItemIndex > -1) {
      const newCart = [...cart]
      newCart[existingItemIndex].quantity += 1
      setCart(newCart)
    } else {
      setCart([...cart, { product, size, quantity: 1, paymentMethod }])
    }

    toast.success("Added to cart!")
  }

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index)
      return
    }

    const newCart = [...cart]
    newCart[index].quantity = newQuantity
    setCart(newCart)
  }

  const removeFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index)
    setCart(newCart)
    toast.success("Removed from cart")
  }

  const clearCart = () => {
    setCart([])
    toast.success("Cart cleared")
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      if (item.paymentMethod === "cash") {
        return total + item.product.price * item.quantity
      }
      return total
    }, 0)
  }

  const getCartCoinTotal = () => {
    return cart.reduce((total, item) => {
      if (item.paymentMethod === "coins") {
        return total + item.product.coin_price * item.quantity
      }
      return total
    }, 0)
  }

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))]
  const filteredProducts =
    selectedCategory === "all" ? products : products.filter((p) => p.category === selectedCategory)

  const canAccessProduct = (product: Product) => {
    if (!product.is_premium_only) return true
    if (!user) return false
    if (!product.required_tier) return true

    const tierOrder = ["grassroot", "pioneer", "elder", "blood"]
    const userTierIndex = tierOrder.indexOf(userProfile?.tier || "grassroot")
    const requiredTierIndex = tierOrder.indexOf(product.required_tier)

    return userTierIndex >= requiredTierIndex
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Erigga Merch Store</h1>
          <p className="text-muted-foreground">Official merchandise and collectibles</p>
        </div>

        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative bg-transparent">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart
              {getCartItemCount() > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {getCartItemCount()}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Shopping Cart ({getCartItemCount()} items)</SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Your cart is empty</p>
              ) : (
                <>
                  {cart.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <img
                        src={item.product.images[0] || "/placeholder.svg"}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product.name}</h4>
                        <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                        <p className="text-sm font-medium">
                          {item.paymentMethod === "cash"
                            ? `₦${item.product.price.toLocaleString()}`
                            : `${item.product.coin_price} coins`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => removeFromCart(index)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2">
                    {getCartTotal() > 0 && (
                      <div className="flex justify-between">
                        <span>Cash Total:</span>
                        <span className="font-medium">₦{getCartTotal().toLocaleString()}</span>
                      </div>
                    )}
                    {getCartCoinTotal() > 0 && (
                      <div className="flex justify-between">
                        <span>Coin Total:</span>
                        <span className="font-medium">{getCartCoinTotal()} coins</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <PaystackCheckout
                      cart={cart}
                      onSuccess={() => {
                        clearCart()
                        setIsCartOpen(false)
                      }}
                    />
                    <Button variant="outline" className="w-full bg-transparent" onClick={clearCart}>
                      Clear Cart
                    </Button>
                  </div>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
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
            userCoins={userProfile?.coins || 0}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found in this category.</p>
        </div>
      )}
    </div>
  )
}

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product, size: string, paymentMethod: "cash" | "coins") => void
  canAccess: boolean
  userCoins: number
}

function ProductCard({ product, onAddToCart, canAccess, userCoins }: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "coins">("cash")

  const handleAddToCart = () => {
    if (!selectedSize && product.sizes.length > 0) {
      toast.error("Please select a size")
      return
    }

    onAddToCart(product, selectedSize || "One Size", paymentMethod)
  }

  return (
    <Card className={`${!canAccess ? "opacity-60" : ""}`}>
      <CardHeader className="p-0">
        <div className="relative">
          <img
            src={product.images[0] || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-64 object-cover rounded-t-lg"
          />
          {product.is_premium_only && (
            <Badge className="absolute top-2 right-2" variant="secondary">
              {product.required_tier} Only
            </Badge>
          )}
          {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
            <Badge className="absolute top-2 left-2" variant="destructive">
              Only {product.stock_quantity} left
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <CardTitle className="text-lg mb-2">{product.name}</CardTitle>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center mb-3">
          <div className="flex items-center">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="ml-1 text-sm">{product.rating}</span>
            <span className="ml-1 text-sm text-muted-foreground">({product.review_count})</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">₦{product.price.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">or {product.coin_price} coins</span>
          </div>

          {product.sizes.length > 0 && (
            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {product.sizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={paymentMethod} onValueChange={(value: "cash" | "coins") => setPaymentMethod(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Pay with Cash (₦{product.price.toLocaleString()})</SelectItem>
              <SelectItem value="coins" disabled={userCoins < product.coin_price}>
                Pay with Coins ({product.coin_price} coins)
                {userCoins < product.coin_price && " - Insufficient"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button className="w-full" onClick={handleAddToCart} disabled={!canAccess || product.stock_quantity === 0}>
          {!canAccess ? "Tier Required" : product.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
      </CardFooter>
    </Card>
  )
}
