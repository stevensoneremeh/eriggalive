"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ShoppingCart, Star, Plus, Minus, Trash2, CreditCard, Coins } from "lucide-react"
import { PaystackCheckout } from "@/components/paystack-checkout"
import { useToast } from "@/hooks/use-toast"

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

interface CustomerInfo {
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
}

export default function MerchPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  })
  const { toast } = useToast()

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
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/merch/products")
      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product: Product, size: string, paymentMethod: "cash" | "coins") => {
    const existingItem = cart.find(
      (item) => item.product.id === product.id && item.size === size && item.payment_method === paymentMethod,
    )

    if (existingItem) {
      setCart(cart.map((item) => (item === existingItem ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      setCart([...cart, { product, size, quantity: 1, payment_method: paymentMethod }])
    }

    toast({
      title: "Added to cart",
      description: `${product.name} (${size}) added to cart`,
    })
  }

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index)
      return
    }

    setCart(cart.map((item, i) => (i === index ? { ...item, quantity: newQuantity } : item)))
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
    toast({
      title: "Removed from cart",
      description: "Item removed from cart",
    })
  }

  const clearCart = () => {
    setCart([])
    toast({
      title: "Cart cleared",
      description: "All items removed from cart",
    })
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      if (item.payment_method === "cash") {
        return total + item.product.price * item.quantity
      }
      return total
    }, 0)
  }

  const getCartCoinTotal = () => {
    return cart.reduce((total, item) => {
      if (item.payment_method === "coins") {
        return total + item.product.coin_price * item.quantity
      }
      return total
    }, 0)
  }

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))]
  const filteredProducts =
    selectedCategory === "all" ? products : products.filter((p) => p.category === selectedCategory)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-xl">Loading merch...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Erigga Official Merch</h1>
            <p className="text-gray-400">Rep the Paper Boi with official merchandise</p>
          </div>

          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative mt-4 md:mt-0 bg-transparent">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart ({cart.length})
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-green-500">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-black border-gray-800 text-white">
              <SheetHeader>
                <SheetTitle className="text-white">Shopping Cart</SheetTitle>
              </SheetHeader>

              <div className="mt-6">
                {cart.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Your cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {cart.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4 p-4 border border-gray-800 rounded-lg">
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
                            <div className="flex items-center space-x-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span>{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => removeFromCart(index)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-right">
                            {item.payment_method === "cash" ? (
                              <p className="font-semibold">{formatPrice(item.product.price * item.quantity)}</p>
                            ) : (
                              <p className="font-semibold text-yellow-500">
                                {item.product.coin_price * item.quantity} coins
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                      {getCartTotal() > 0 && (
                        <div className="flex justify-between">
                          <span>Cash Total:</span>
                          <span className="font-semibold">{formatPrice(getCartTotal())}</span>
                        </div>
                      )}
                      {getCartCoinTotal() > 0 && (
                        <div className="flex justify-between">
                          <span>Coin Total:</span>
                          <span className="font-semibold text-yellow-500">{getCartCoinTotal()} coins</span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <Button variant="outline" onClick={clearCart} className="flex-1 bg-transparent">
                        Clear Cart
                      </Button>
                      <Button
                        onClick={() => {
                          setIsCartOpen(false)
                          setIsCheckoutOpen(true)
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={cart.length === 0}
                      >
                        Checkout
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48 bg-gray-900 border-gray-700">
              <SelectValue placeholder="Select category" />
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
            <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-xl">No products found in this category</p>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <PaystackCheckout
          cart={cart}
          customerInfo={customerInfo}
          onCustomerInfoChange={setCustomerInfo}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={() => {
            clearCart()
            setIsCheckoutOpen(false)
            toast({
              title: "Order placed successfully!",
              description: "You will receive a confirmation email shortly.",
            })
          }}
        />
      )}
    </div>
  )
}

function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product
  onAddToCart: (product: Product, size: string, paymentMethod: "cash" | "coins") => void
}) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "coins">("cash")

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price)
  }

  return (
    <Card className="bg-gray-900 border-gray-700 text-white overflow-hidden">
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
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            <span className="ml-1 text-sm">{product.rating}</span>
          </div>
          <span className="text-gray-400 text-sm">({product.review_count} reviews)</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xl font-bold">{formatPrice(product.price)}</p>
            <p className="text-yellow-500 text-sm">{product.coin_price} coins</p>
          </div>
          <Badge variant="outline" className="text-green-500 border-green-500">
            {product.category}
          </Badge>
        </div>

        {product.sizes.length > 1 && (
          <div>
            <Label className="text-sm font-medium">Size</Label>
            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger className="bg-gray-800 border-gray-600 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {product.sizes.map((size) => (
                  <SelectItem key={size} value={size} className="text-white">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label className="text-sm font-medium">Payment Method</Label>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(value: "cash" | "coins") => setPaymentMethod(value)}
            className="flex space-x-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="flex items-center">
                <CreditCard className="w-4 h-4 mr-1" />
                Cash
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="coins" id="coins" />
              <Label htmlFor="coins" className="flex items-center">
                <Coins className="w-4 h-4 mr-1" />
                Coins
              </Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={() => onAddToCart(product, selectedSize, paymentMethod)}
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={product.stock_quantity === 0}
        >
          {product.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
      </CardFooter>
    </Card>
  )
}
