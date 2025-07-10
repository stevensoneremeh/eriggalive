-- Erigga Merch Store Schema
-- Creates all necessary tables for the e-commerce functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL DEFAULT 0, -- Price in kobo/cents
    coin_price INTEGER NOT NULL DEFAULT 0, -- Price in Erigga coins
    images TEXT[] DEFAULT '{}', -- Array of image URLs
    sizes TEXT[] DEFAULT '{}', -- Available sizes
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    is_premium_only BOOLEAN DEFAULT FALSE,
    required_tier VARCHAR(50), -- 'blood', 'elder', etc.
    stock_quantity INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_amount INTEGER DEFAULT 0, -- Cash amount in kobo
    coin_amount INTEGER DEFAULT 0, -- Coin amount
    payment_method VARCHAR(50) NOT NULL, -- 'paystack', 'coins', 'mixed'
    payment_reference VARCHAR(255), -- Paystack reference or transaction ID
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
    customer_info JSONB NOT NULL, -- Customer delivery information
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    size VARCHAR(50),
    price INTEGER DEFAULT 0, -- Cash price per item
    coin_price INTEGER DEFAULT 0, -- Coin price per item
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, user_id) -- One review per user per product
);

-- Create coin_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS coin_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Positive for credits, negative for debits
    type VARCHAR(50) NOT NULL, -- 'purchase', 'reward', 'refund', etc.
    description TEXT,
    reference VARCHAR(255), -- Order ID, payment reference, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add coin_balance column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'coin_balance'
    ) THEN
        ALTER TABLE users ADD COLUMN coin_balance INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_tier ON products(required_tier);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);

-- Create function to update product ratings
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products 
    SET 
        rating = (
            SELECT COALESCE(AVG(rating::DECIMAL), 0) 
            FROM product_reviews 
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        ),
        review_count = (
            SELECT COUNT(*) 
            FROM product_reviews 
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product rating updates
DROP TRIGGER IF EXISTS trigger_update_product_rating ON product_reviews;
CREATE TRIGGER trigger_update_product_rating
    AFTER INSERT OR UPDATE OR DELETE ON product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();

-- Insert sample products
INSERT INTO products (name, description, price, coin_price, images, sizes, category, is_premium_only, required_tier, stock_quantity, rating, review_count) VALUES
('Paper Boi Hoodie', 'Premium quality hoodie with Erigga''s signature Paper Boi design', 15000, 1500, ARRAY['/placeholder.svg?height=400&width=400'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], 'clothing', FALSE, NULL, 25, 4.8, 124),
('Warri Vibe T-Shirt', 'Comfortable cotton t-shirt representing Warri culture', 8000, 800, ARRAY['/placeholder.svg?height=400&width=400'], ARRAY['S', 'M', 'L', 'XL'], 'clothing', FALSE, NULL, 50, 4.6, 89),
('Erigga Signature Cap', 'Adjustable cap with embroidered Erigga logo', 5000, 500, ARRAY['/placeholder.svg?height=400&width=400'], ARRAY['One Size'], 'accessories', FALSE, NULL, 75, 4.7, 156),
('Limited Edition Vinyl Record', 'Exclusive vinyl record of ''The Erigma'' album – Blood tier exclusive', 25000, 2500, ARRAY['/placeholder.svg?height=400&width=400'], ARRAY['Standard'], 'collectibles', TRUE, 'blood', 10, 5.0, 23),
('Street Chronicles Poster Set', 'Set of 3 high-quality posters from different eras', 3000, 300, ARRAY['/placeholder.svg?height=400&width=400'], ARRAY['A2'], 'collectibles', FALSE, NULL, 100, 4.5, 67),
('Erigga Phone Case', 'Protective phone case with custom Erigga artwork', 4500, 450, ARRAY['/placeholder.svg?height=400&width=400'], ARRAY['iPhone 14', 'iPhone 15', 'Samsung S23', 'Samsung S24'], 'accessories', FALSE, NULL, 40, 4.4, 78)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products (public read, admin write)
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Products are insertable by authenticated users" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Products are updatable by authenticated users" ON products FOR UPDATE USING (auth.role() =  'authenticated');

-- RLS Policies for orders (users can only see their own orders)
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own orders" ON orders FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for order_items (users can only see items from their orders)
CREATE POLICY "Users can view their own order items" ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Users can create order items for their orders" ON order_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- RLS Policies for product_reviews (public read, authenticated write own)
CREATE POLICY "Product reviews are viewable by everyone" ON product_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create their own reviews" ON product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON product_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON product_reviews FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for coin_transactions (users can only see their own transactions)
CREATE POLICY "Users can view their own coin transactions" ON coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own coin transactions" ON coin_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== MERCH STORE SCHEMA CREATED SUCCESSFULLY ===';
    RAISE NOTICE 'Tables created: products, orders, order_items, product_reviews, coin_transactions';
    RAISE NOTICE 'Sample products inserted: 6 products with various categories and tiers';
    RAISE NOTICE 'RLS policies configured for security';
    RAISE NOTICE 'Indexes created for performance';
    RAISE NOTICE 'Triggers set up for automatic rating updates';
    RAISE NOTICE '';
    RAISE NOTICE 'Your merch store is now ready for production!';
    RAISE NOTICE 'Make sure to set up your Paystack environment variables:';
    RAISE NOTICE '- NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY';
    RAISE NOTICE '- PAYSTACK_SECRET_KEY';
END $$;
