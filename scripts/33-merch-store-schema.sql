-- Merch Store Schema for Erigga Fan Platform
-- This script creates the necessary tables for the merchandise store functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    coin_price INTEGER NOT NULL DEFAULT 0,
    images TEXT[] DEFAULT '{}',
    sizes TEXT[] DEFAULT '{}',
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    is_premium_only BOOLEAN DEFAULT FALSE,
    required_tier VARCHAR(50),
    stock_quantity INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reference VARCHAR(255) UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) DEFAULT 0,
    total_coins INTEGER DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'pending',
    order_status VARCHAR(50) DEFAULT 'pending',
    customer_info JSONB NOT NULL,
    payment_data JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    size VARCHAR(50),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2),
    unit_coin_price INTEGER,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'coins')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coin_transactions table for tracking coin payments
CREATE TABLE IF NOT EXISTS coin_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reference VARCHAR(255),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_premium_only ON products(is_premium_only);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_reference ON orders(reference);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON coin_transactions(type);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);

-- Insert sample products
INSERT INTO products (name, description, price, coin_price, images, sizes, category, is_premium_only, required_tier, stock_quantity, rating, review_count) VALUES
('Paper Boi Hoodie', 'Premium quality hoodie with Erigga''s signature Paper Boi design', 15000, 1500, ARRAY['/placeholder.svg?height=400&width=400'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], 'clothing', FALSE, NULL, 25, 4.8, 124),
('Warri Vibe T-Shirt', 'Comfortable cotton t-shirt representing Warri culture', 8000, 800, ARRAY['/placeholder.svg?height=400&width=400'], ARRAY['S', 'M', 'L', 'XL'], 'clothing', FALSE, NULL, 50, 4.6, 89),
('Erigga Signature Cap', 'Adjustable cap with embroidered Erigga logo', 5000, 500, ARRAY['/placeholder.svg?height=400&width=400'], ARRAY['One Size'], 'accessories', FALSE, NULL, 75, 4.7, 156),
('Limited Edition Vinyl Record', 'Exclusive vinyl record of ''The Erigma'' album - Blood tier exclusive', 25000, 2500, ARRAY['/placeholder.svg?height=400&width=400'], ARRAY['Standard'], 'collectibles', TRUE, 'blood', 10, 5.0, 23),
('Street Chronicles Poster Set', 'Set of 3 high-quality posters from different eras', 3000, 300, ARRAY['/placeholder.svg?height=400&width=400'], ARRAY['A2'], 'collectibles', FALSE, NULL, 100, 4.5, 67),
('Erigga Phone Case', 'Protective phone case with custom Erigga artwork', 4500, 450, ARRAY['/placeholder.svg?height=400&width=400'], ARRAY['iPhone 14', 'iPhone 15', 'Samsung S23', 'Samsung S24'], 'accessories', FALSE, NULL, 40, 4.4, 78)
ON CONFLICT DO NOTHING;

-- Create function to update product ratings
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products 
    SET 
        rating = (
            SELECT COALESCE(AVG(rating), 0)
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

-- Create trigger to automatically update product ratings
DROP TRIGGER IF EXISTS trigger_update_product_rating ON product_reviews;
CREATE TRIGGER trigger_update_product_rating
    AFTER INSERT OR UPDATE OR DELETE ON product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();

-- Create RLS policies for products (public read access)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone" ON products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Products are manageable by admins" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Create RLS policies for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own orders" ON orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Create RLS policies for order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Create RLS policies for coin_transactions
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own coin transactions" ON coin_transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create coin transactions" ON coin_transactions
    FOR INSERT WITH CHECK (true);

-- Create RLS policies for product_reviews
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone" ON product_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own reviews" ON product_reviews
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reviews" ON product_reviews
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reviews" ON product_reviews
    FOR DELETE USING (user_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT ON products TO anon, authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;
GRANT ALL ON coin_transactions TO authenticated;
GRANT ALL ON product_reviews TO authenticated;

-- Create updated_at trigger for orders
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at
    BEFORE UPDATE ON product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Merch store schema created successfully!';
    RAISE NOTICE 'Tables created: products, orders, order_items, coin_transactions, product_reviews';
    RAISE NOTICE 'Sample products inserted';
    RAISE NOTICE 'RLS policies configured';
    RAISE NOTICE 'Functions and triggers created';
END $$;
