-- =====================================================
-- ERIGGA FAN PLATFORM - PRODUCTION DATABASE SCHEMA
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_tier AS ENUM ('grassroot', 'pioneer', 'elder', 'blood_brotherhood', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE content_type AS ENUM ('album', 'track', 'video', 'image', 'document');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('purchase', 'withdrawal', 'reward', 'refund', 'admin_adjustment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- ENHANCED USER MANAGEMENT
-- =====================================================

-- Enhanced users table with production features
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    tier user_tier DEFAULT 'grassroot',
    coins INTEGER DEFAULT 0 CHECK (coins >= 0),
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    points INTEGER DEFAULT 0 CHECK (points >= 0),
    
    -- Account status
    is_active BOOLEAN DEFAULT true,
    is_banned BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    
    -- Login tracking
    last_login TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    
    -- Profile completion
    profile_completion_percentage INTEGER DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100),
    
    -- Preferences
    preferences JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_username CHECK (username ~* '^[a-zA-Z0-9_]{3,50}$')
);

-- Enhanced user sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- Device information
    device_info JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    
    -- Session management
    is_active BOOLEAN DEFAULT true,
    remember_me BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    
    -- Security
    fingerprint VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ,
    
    -- Indexes
    INDEX idx_user_sessions_user_id (user_id),
    INDEX idx_user_sessions_token (session_token),
    INDEX idx_user_sessions_active (user_id, is_active, expires_at),
    INDEX idx_user_sessions_cleanup (expires_at, is_active)
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL,
    ip_address INET,
    action VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_rate_limits_key_time (key, created_at),
    INDEX idx_rate_limits_cleanup (created_at)
);

-- Enhanced audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(100),
    
    -- Request information
    ip_address INET,
    user_agent TEXT,
    
    -- Additional data
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_audit_logs_user_action (user_id, action),
    INDEX idx_audit_logs_time (created_at),
    INDEX idx_audit_logs_resource (resource_type, resource_id)
);

-- =====================================================
-- ENHANCED CONTENT MANAGEMENT
-- =====================================================

-- Enhanced content table
CREATE TABLE IF NOT EXISTS content (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type content_type NOT NULL,
    
    -- File information
    file_url TEXT,
    file_size BIGINT,
    file_type VARCHAR(100),
    duration INTEGER, -- for audio/video in seconds
    
    -- Access control
    tier_required user_tier DEFAULT 'grassroot',
    coin_cost INTEGER DEFAULT 0 CHECK (coin_cost >= 0),
    is_premium BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    
    -- Engagement
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    
    -- SEO and metadata
    slug VARCHAR(255) UNIQUE,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    
    -- Indexes
    INDEX idx_content_type_published (type, is_published, published_at),
    INDEX idx_content_tier_cost (tier_required, coin_cost),
    INDEX idx_content_featured (is_featured, published_at),
    INDEX idx_content_slug (slug),
    INDEX idx_content_tags USING GIN (tags)
);

-- Content access logs
CREATE TABLE IF NOT EXISTS content_access_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content_id INTEGER REFERENCES content(id) ON DELETE CASCADE,
    access_type VARCHAR(50) NOT NULL, -- 'view', 'download', 'like'
    coins_spent INTEGER DEFAULT 0,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_content_access_user_content (user_id, content_id),
    INDEX idx_content_access_type_time (access_type, created_at)
);

-- =====================================================
-- ENHANCED COMMERCE SYSTEM
-- =====================================================

-- Enhanced products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    compare_at_price DECIMAL(10,2) CHECK (compare_at_price >= price),
    cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
    
    -- Inventory
    sku VARCHAR(100) UNIQUE,
    inventory_quantity INTEGER DEFAULT 0 CHECK (inventory_quantity >= 0),
    track_inventory BOOLEAN DEFAULT true,
    allow_backorder BOOLEAN DEFAULT false,
    
    -- Product details
    weight DECIMAL(8,2),
    dimensions JSONB, -- {length, width, height}
    category VARCHAR(100),
    tags TEXT[],
    
    -- Media
    images TEXT[],
    featured_image TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- SEO
    slug VARCHAR(255) UNIQUE,
    seo_title VARCHAR(255),
    seo_description TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_products_active_featured (is_active, is_featured),
    INDEX idx_products_category (category),
    INDEX idx_products_slug (slug),
    INDEX idx_products_sku (sku)
);

-- Enhanced orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
    shipping_amount DECIMAL(10,2) DEFAULT 0 CHECK (shipping_amount >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending',
    fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled',
    
    -- Customer information
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    
    -- Shipping address
    shipping_address JSONB,
    billing_address JSONB,
    
    -- Payment information
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    
    -- Notes and metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    INDEX idx_orders_user_status (user_id, status),
    INDEX idx_orders_number (order_number),
    INDEX idx_orders_payment_status (payment_status),
    INDEX idx_orders_created (created_at)
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    
    -- Product snapshot
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    
    -- Pricing
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    
    -- Product details at time of order
    product_snapshot JSONB,
    
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_product (product_id)
);

-- =====================================================
-- ENHANCED COIN SYSTEM
-- =====================================================

-- Enhanced coin transactions
CREATE TABLE IF NOT EXISTS coin_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
    
    -- Transaction details
    description TEXT,
    reference VARCHAR(255),
    
    -- Related entities
    related_type VARCHAR(100), -- 'content', 'order', 'referral', etc.
    related_id INTEGER,
    
    -- Payment information (for purchases)
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    payment_amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'NGN',
    
    -- Status
    status transaction_status DEFAULT 'pending',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    INDEX idx_coin_transactions_user_type (user_id, type),
    INDEX idx_coin_transactions_status (status),
    INDEX idx_coin_transactions_reference (reference),
    INDEX idx_coin_transactions_related (related_type, related_id)
);

-- =====================================================
-- ENHANCED SOCIAL FEATURES
-- =====================================================

-- Enhanced posts table
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'video', 'audio', 'poll'
    
    -- Media attachments
    media_urls TEXT[],
    
    -- Engagement
    like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
    comment_count INTEGER DEFAULT 0 CHECK (comment_count >= 0),
    share_count INTEGER DEFAULT 0 CHECK (share_count >= 0),
    
    -- Moderation
    is_pinned BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    is_reported BOOLEAN DEFAULT false,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_posts_user_created (user_id, created_at),
    INDEX idx_posts_featured_pinned (is_featured, is_pinned, created_at),
    INDEX idx_posts_moderation (is_hidden, is_reported)
);

-- Enhanced comments table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    
    -- Engagement
    like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
    
    -- Moderation
    is_hidden BOOLEAN DEFAULT false,
    is_reported BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_comments_post_created (post_id, created_at),
    INDEX idx_comments_user (user_id),
    INDEX idx_comments_parent (parent_id)
);

-- =====================================================
-- PERFORMANCE MONITORING
-- =====================================================

-- System metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,6) NOT NULL,
    metric_unit VARCHAR(20),
    tags JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_system_metrics_name_time (metric_name, created_at),
    INDEX idx_system_metrics_tags USING GIN (tags)
);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_update_%s_updated_at ON %s', t, t);
        EXECUTE format('CREATE TRIGGER trigger_update_%s_updated_at 
                       BEFORE UPDATE ON %s 
                       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END;
$$;

-- Function to update user coin balance
CREATE OR REPLACE FUNCTION update_user_coins()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
        UPDATE users 
        SET coins = NEW.balance_after 
        WHERE id = NEW.user_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
        UPDATE users 
        SET coins = NEW.balance_after 
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for coin balance updates
DROP TRIGGER IF EXISTS trigger_update_user_coins ON coin_transactions;
CREATE TRIGGER trigger_update_user_coins
    AFTER INSERT OR UPDATE ON coin_transactions
    FOR EACH ROW EXECUTE FUNCTION update_user_coins();

-- Function to update engagement counts
CREATE OR REPLACE FUNCTION update_engagement_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'post_likes' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'comments' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own data
CREATE POLICY users_own_data ON users
    FOR ALL USING (auth.uid() = auth_user_id);

-- Admin users can view all data
CREATE POLICY users_admin_access ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND tier = 'admin'
        )
    );

-- Sessions belong to users
CREATE POLICY user_sessions_own_data ON user_sessions
    FOR ALL USING (
        user_id IN (
            SELECT id FROM users WHERE auth_user_id = auth.uid()
        )
    );

-- Content visibility based on tier and publication status
CREATE POLICY content_visibility ON content
    FOR SELECT USING (
        is_published = true AND (
            tier_required = 'grassroot' OR
            tier_required <= (
                SELECT tier FROM users WHERE auth_user_id = auth.uid()
            )::text::user_tier
        )
    );

-- Users can view their own transactions
CREATE POLICY coin_transactions_own_data ON coin_transactions
    FOR ALL USING (
        user_id IN (
            SELECT id FROM users WHERE auth_user_id = auth.uid()
        )
    );

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tier_active ON users(tier, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_coins ON users(coins DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_level_points ON users(level DESC, points DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_engagement ON content(view_count DESC, like_count DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_engagement ON posts(like_count DESC, comment_count DESC, created_at DESC);

-- Cleanup old data function
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Clean up expired sessions
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() - INTERVAL '7 days';
    
    -- Clean up old rate limit entries
    DELETE FROM rate_limits 
    WHERE created_at < NOW() - INTERVAL '1 hour';
    
    -- Clean up old audit logs (keep 90 days)
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Clean up old system metrics (keep 30 days)
    DELETE FROM system_metrics 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (would be handled by cron in production)
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * *', 'SELECT cleanup_old_data();');
