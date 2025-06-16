-- =====================================================
-- ERIGGA FAN PLATFORM - PRODUCTION OPTIMIZED SCHEMA
-- =====================================================

-- Enable required extensions for production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create optimized custom types
DO $$ BEGIN
    CREATE TYPE user_tier AS ENUM ('grassroot', 'pioneer', 'elder', 'blood_brotherhood');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE content_type AS ENUM ('album', 'track', 'video', 'image', 'document', 'chronicle');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('purchase', 'withdrawal', 'reward', 'refund', 'admin_adjustment');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================================================
-- PRODUCTION USERS TABLE WITH OPTIMIZATIONS
-- =====================================================

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
    
    -- Account status with indexes
    is_active BOOLEAN DEFAULT true,
    is_banned BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    ban_reason TEXT,
    banned_until TIMESTAMPTZ,
    
    -- Enhanced login tracking
    last_login TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Profile and engagement
    profile_completion_percentage INTEGER DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100),
    total_spent DECIMAL(10,2) DEFAULT 0,
    total_earned DECIMAL(10,2) DEFAULT 0,
    referral_code VARCHAR(20) UNIQUE,
    referred_by INTEGER REFERENCES users(id),
    
    -- Location and demographics
    country VARCHAR(2),
    timezone VARCHAR(50),
    language VARCHAR(10) DEFAULT 'en',
    
    -- Preferences with JSONB for performance
    preferences JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    privacy_settings JSONB DEFAULT '{"profile_public": true, "show_activity": true}',
    
    -- Metadata and tracking
    metadata JSONB DEFAULT '{}',
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_username CHECK (username ~* '^[a-zA-Z0-9_]{3,50}$'),
    CONSTRAINT valid_referral_code CHECK (referral_code ~* '^[A-Z0-9]{6,20}$')
);

-- Production-optimized indexes for users table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active ON users(email) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_active ON users(username) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tier_active ON users(tier, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_coins_desc ON users(coins DESC) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_level_points ON users(level DESC, points DESC) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_activity ON users(last_activity DESC) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_country_tier ON users(country, tier) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);

-- =====================================================
-- ENHANCED SESSION MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- Enhanced device information
    device_info JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    location_data JSONB,
    
    -- Session management
    is_active BOOLEAN DEFAULT true,
    remember_me BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    
    -- Security tracking
    login_method VARCHAR(50) DEFAULT 'password',
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ,
    
    -- Performance indexes
    CONSTRAINT valid_session_token CHECK (length(session_token) >= 32),
    CONSTRAINT valid_refresh_token CHECK (length(refresh_token) >= 32)
);

-- Session indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id, is_active, expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_cleanup ON user_sessions(expires_at, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_ip_activity ON user_sessions(ip_address, last_activity);

-- =====================================================
-- ENHANCED CONTENT MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS content (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type content_type NOT NULL,
    
    -- File information with optimization
    file_url TEXT,
    file_size BIGINT,
    file_type VARCHAR(100),
    duration INTEGER,
    quality VARCHAR(20),
    
    -- Enhanced access control
    tier_required user_tier DEFAULT 'grassroot',
    coin_cost INTEGER DEFAULT 0 CHECK (coin_cost >= 0),
    is_premium BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    is_exclusive BOOLEAN DEFAULT false,
    
    -- Advanced engagement tracking
    view_count INTEGER DEFAULT 0,
    unique_view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    
    -- Revenue tracking
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_coins_earned INTEGER DEFAULT 0,
    
    -- SEO and discoverability
    slug VARCHAR(255) UNIQUE,
    tags TEXT[],
    categories TEXT[],
    search_vector TSVECTOR,
    
    -- Content management
    created_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approval_status VARCHAR(20) DEFAULT 'pending',
    
    -- Metadata with JSONB for flexibility
    metadata JSONB DEFAULT '{}',
    analytics_data JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    featured_until TIMESTAMPTZ,
    
    -- Full-text search
    CONSTRAINT valid_slug CHECK (slug ~* '^[a-z0-9-]+$')
);

-- Content performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_published_featured ON content(is_published, is_featured, published_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_type_tier ON content(type, tier_required, is_published);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_engagement ON content(view_count DESC, like_count DESC) WHERE is_published = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_slug ON content(slug) WHERE is_published = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_tags_gin ON content USING GIN (tags);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_search_vector ON content USING GIN (search_vector);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_created_by ON content(created_by, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_revenue ON content(total_revenue DESC) WHERE is_published = true;

-- =====================================================
-- ENHANCED COMMERCE SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS coin_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL CHECK (balance_before >= 0),
    balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
    
    -- Enhanced transaction details
    description TEXT,
    reference VARCHAR(255) UNIQUE,
    external_reference VARCHAR(255),
    
    -- Related entities with polymorphic support
    related_type VARCHAR(100),
    related_id INTEGER,
    
    -- Payment information
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    payment_amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'NGN',
    exchange_rate DECIMAL(10,6) DEFAULT 1.0,
    
    -- Enhanced status tracking
    status transaction_status DEFAULT 'pending',
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Fraud detection
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    ip_address INET,
    user_agent TEXT,
    
    -- Metadata and analytics
    metadata JSONB DEFAULT '{}',
    analytics_data JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_amount CHECK (amount != 0),
    CONSTRAINT valid_balance_change CHECK (
        (type IN ('purchase', 'reward', 'refund') AND amount > 0) OR
        (type IN ('withdrawal', 'spend') AND amount < 0)
    )
);

-- Transaction performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coin_transactions_user_status ON coin_transactions(user_id, status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coin_transactions_reference ON coin_transactions(reference) WHERE reference IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coin_transactions_payment_ref ON coin_transactions(payment_reference) WHERE payment_reference IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coin_transactions_related ON coin_transactions(related_type, related_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coin_transactions_pending ON coin_transactions(created_at) WHERE status = 'pending';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coin_transactions_analytics ON coin_transactions(type, created_at) WHERE status = 'completed';

-- =====================================================
-- ENHANCED SOCIAL FEATURES
-- =====================================================

CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'text',
    
    -- Enhanced media support
    media_urls TEXT[],
    media_metadata JSONB DEFAULT '{}',
    
    -- Advanced engagement
    like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
    comment_count INTEGER DEFAULT 0 CHECK (comment_count >= 0),
    share_count INTEGER DEFAULT 0 CHECK (share_count >= 0),
    view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
    
    -- Coin-based interactions
    coin_tips_received INTEGER DEFAULT 0 CHECK (coin_tips_received >= 0),
    coin_tips_count INTEGER DEFAULT 0 CHECK (coin_tips_count >= 0),
    
    -- Content moderation
    is_pinned BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    is_reported BOOLEAN DEFAULT false,
    moderation_status VARCHAR(20) DEFAULT 'approved',
    moderated_by INTEGER REFERENCES users(id),
    moderated_at TIMESTAMPTZ,
    
    -- Hashtags and mentions
    hashtags TEXT[],
    mentions INTEGER[],
    
    -- Location and context
    location_data JSONB,
    context_data JSONB DEFAULT '{}',
    
    -- Analytics
    analytics_data JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    featured_until TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_content_length CHECK (length(content) >= 1 AND length(content) <= 5000)
);

-- Posts performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC) WHERE NOT is_hidden;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_engagement ON posts(like_count DESC, comment_count DESC, created_at DESC) WHERE NOT is_hidden;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_featured ON posts(is_featured, created_at DESC) WHERE is_featured = true AND NOT is_hidden;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_hashtags_gin ON posts USING GIN (hashtags);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_mentions_gin ON posts USING GIN (mentions);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_moderation ON posts(moderation_status, created_at) WHERE is_reported = true;

-- =====================================================
-- PERFORMANCE MONITORING TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,6) NOT NULL,
    metric_unit VARCHAR(20),
    instance_id VARCHAR(100),
    tags JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Partitioning ready
    CONSTRAINT valid_metric_name CHECK (length(metric_name) > 0)
) PARTITION BY RANGE (created_at);

-- Create partitions for metrics (monthly)
CREATE TABLE IF NOT EXISTS system_metrics_current PARTITION OF system_metrics
    FOR VALUES FROM (date_trunc('month', CURRENT_DATE)) TO (date_trunc('month', CURRENT_DATE + INTERVAL '1 month'));

-- Metrics indexes
CREATE INDEX IF NOT EXISTS idx_system_metrics_name_time ON system_metrics(metric_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_tags_gin ON system_metrics USING GIN (tags);

-- =====================================================
-- ADVANCED FUNCTIONS AND TRIGGERS
-- =====================================================

-- Enhanced updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Update last_activity for users table
    IF TG_TABLE_NAME = 'users' THEN
        NEW.last_activity = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update search vectors
CREATE OR REPLACE FUNCTION update_content_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', array_to_string(COALESCE(NEW.tags, '{}'), ' ')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for content search vector
DROP TRIGGER IF EXISTS trigger_update_content_search_vector ON content;
CREATE TRIGGER trigger_update_content_search_vector
    BEFORE INSERT OR UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_content_search_vector();

-- Function to update user coin balance
CREATE OR REPLACE FUNCTION update_user_coins()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
        UPDATE users 
        SET coins = NEW.balance_after,
            total_spent = CASE WHEN NEW.amount < 0 THEN total_spent + ABS(NEW.amount) ELSE total_spent END,
            total_earned = CASE WHEN NEW.amount > 0 THEN total_earned + NEW.amount ELSE total_earned END
        WHERE id = NEW.user_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
        UPDATE users 
        SET coins = NEW.balance_after,
            total_spent = CASE WHEN NEW.amount < 0 THEN total_spent + ABS(NEW.amount) ELSE total_spent END,
            total_earned = CASE WHEN NEW.amount > 0 THEN total_earned + NEW.amount ELSE total_earned END
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Enhanced engagement update function
CREATE OR REPLACE FUNCTION update_engagement_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'post_likes' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'comments' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply all triggers
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
        AND table_name NOT LIKE '%_partition%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_update_%s_updated_at ON %s', t, t);
        EXECUTE format('CREATE TRIGGER trigger_update_%s_updated_at 
                       BEFORE UPDATE ON %s 
                       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END;
$$;

-- Coin balance trigger
DROP TRIGGER IF EXISTS trigger_update_user_coins ON coin_transactions;
CREATE TRIGGER trigger_update_user_coins
    AFTER INSERT OR UPDATE ON coin_transactions
    FOR EACH ROW EXECUTE FUNCTION update_user_coins();

-- =====================================================
-- PRODUCTION RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS users_own_data ON users;
CREATE POLICY users_own_data ON users
    FOR ALL USING (auth.uid() = auth_user_id OR 
                   EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND tier = 'admin'));

-- Content policies with tier-based access
DROP POLICY IF EXISTS content_visibility ON content;
CREATE POLICY content_visibility ON content
    FOR SELECT USING (
        is_published = true AND 
        approval_status = 'approved' AND (
            tier_required = 'grassroot' OR
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_user_id = auth.uid() 
                AND is_active = true 
                AND NOT is_banned
                AND (
                    CASE tier_required
                        WHEN 'blood_brotherhood' THEN tier = 'blood_brotherhood'
                        WHEN 'elder' THEN tier IN ('elder', 'blood_brotherhood')
                        WHEN 'pioneer' THEN tier IN ('pioneer', 'elder', 'blood_brotherhood')
                        ELSE true
                    END
                )
            )
        )
    );

-- Session policies
DROP POLICY IF EXISTS user_sessions_own_data ON user_sessions;
CREATE POLICY user_sessions_own_data ON user_sessions
    FOR ALL USING (
        user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    );

-- Transaction policies
DROP POLICY IF EXISTS coin_transactions_own_data ON coin_transactions;
CREATE POLICY coin_transactions_own_data ON coin_transactions
    FOR ALL USING (
        user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND tier = 'admin')
    );

-- =====================================================
-- PERFORMANCE OPTIMIZATION PROCEDURES
-- =====================================================

-- Procedure to update statistics
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS void AS $$
BEGIN
    ANALYZE users;
    ANALYZE content;
    ANALYZE posts;
    ANALYZE coin_transactions;
    ANALYZE user_sessions;
END;
$$ LANGUAGE plpgsql;

-- Procedure for cleanup operations
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Clean up expired sessions
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() - INTERVAL '7 days' AND NOT is_active;
    
    -- Clean up old metrics (keep 90 days)
    DELETE FROM system_metrics 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Update statistics after cleanup
    PERFORM update_table_statistics();
    
    -- Log cleanup operation
    INSERT INTO system_metrics (metric_name, metric_value, metric_unit)
    VALUES ('cleanup_operation', 1, 'count');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL PRODUCTION DATA
-- =====================================================

-- Create admin user if not exists
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@eriggalive.com',
    crypt('SecureAdminPassword123!', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"username": "admin"}'
) ON CONFLICT (email) DO NOTHING;

-- Create admin profile
INSERT INTO users (auth_user_id, email, username, full_name, tier, coins, level, points, is_verified)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@eriggalive.com',
    'admin',
    'System Administrator',
    'blood_brotherhood',
    100000,
    100,
    100000,
    true
) ON CONFLICT (email) DO NOTHING;

-- Create content categories
INSERT INTO content (title, description, type, tier_required, is_published, approval_status, created_at)
VALUES 
    ('Welcome to Erigga Live', 'Official welcome message from Erigga', 'video', 'grassroot', true, 'approved', NOW()),
    ('Exclusive Behind the Scenes', 'Exclusive content for premium members', 'video', 'pioneer', true, 'approved', NOW()),
    ('Blood Brotherhood Chronicles', 'Special content for top tier members', 'chronicle', 'blood_brotherhood', true, 'approved', NOW())
ON CONFLICT DO NOTHING;

-- Create initial system metrics
INSERT INTO system_metrics (metric_name, metric_value, metric_unit)
VALUES 
    ('database_initialized', 1, 'boolean'),
    ('schema_version', 1.0, 'version'),
    ('production_ready', 1, 'boolean');

COMMIT;
