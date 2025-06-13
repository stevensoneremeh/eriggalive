-- Enhanced coin transactions with detailed tracking
CREATE TABLE IF NOT EXISTS public.coin_transactions (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    amount integer not null,
    transaction_type transaction_type not null,
    payment_method payment_method,
    reference_id text unique,
    external_reference text,
    status payment_status not null default 'pending',
    description text,
    metadata jsonb default '{}',
    fee_amount integer default 0,
    net_amount integer,
    currency text default 'NGN',
    exchange_rate decimal(10,4) default 1.0000,
    processed_at timestamp with time zone,
    failed_at timestamp with time zone,
    failure_reason text,
    refunded_at timestamp with time zone,
    refund_reason text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Content access tracking
CREATE TABLE IF NOT EXISTS public.content_access (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    content_type text not null,
    content_id bigint not null,
    access_type text not null default 'purchase' check (access_type in ('purchase', 'subscription', 'free', 'promotional')),
    coins_spent integer default 0 check (coins_spent >= 0),
    expires_at timestamp with time zone,
    access_count integer default 0 check (access_count >= 0),
    last_accessed timestamp with time zone,
    is_active boolean default true,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    unique(user_id, content_type, content_id)
);

-- Products for merchandise
CREATE TABLE IF NOT EXISTS public.products (
    id bigint primary key generated always as identity,
    name text not null,
    slug text unique not null,
    description text,
    short_description text,
    price decimal(10,2) not null check (price >= 0),
    compare_at_price decimal(10,2) check (compare_at_price >= price),
    cost_price decimal(10,2) check (cost_price >= 0),
    images text[] default '{}',
    thumbnail_url text,
    sizes text[] default '{}',
    colors text[] default '{}',
    category text,
    subcategory text,
    brand text default 'Erigga Official',
    sku text unique,
    barcode text,
    is_premium_only boolean default false,
    required_tier user_tier default 'grassroot',
    coin_price integer default 0 check (coin_price >= 0),
    stock_quantity integer default 0 check (stock_quantity >= 0),
    low_stock_threshold integer default 10,
    weight decimal(8,2),
    dimensions jsonb default '{}',
    is_active boolean default true,
    is_featured boolean default false,
    is_digital boolean default false,
    requires_shipping boolean default true,
    tax_rate decimal(5,4) default 0.0000,
    tags text[] default '{}',
    seo_title text,
    seo_description text,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Product variants for different options
CREATE TABLE IF NOT EXISTS public.product_variants (
    id bigint primary key generated always as identity,
    product_id bigint not null references public.products(id) on delete cascade,
    name text not null,
    sku text unique,
    price decimal(10,2) not null check (price >= 0),
    compare_at_price decimal(10,2),
    cost_price decimal(10,2),
    stock_quantity integer default 0 check (stock_quantity >= 0),
    weight decimal(8,2),
    size text,
    color text,
    material text,
    image_url text,
    is_active boolean default true,
    position integer default 0,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Orders for merchandise purchases
CREATE TABLE IF NOT EXISTS public.orders (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    order_number text unique not null,
    status text not null default 'pending' check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'canceled', 'refunded')),
    payment_status payment_status default 'pending',
    payment_method payment_method,
    payment_reference text,
    subtotal decimal(10,2) not null check (subtotal >= 0),
    tax_amount decimal(10,2) default 0 check (tax_amount >= 0),
    shipping_amount decimal(10,2) default 0 check (shipping_amount >= 0),
    discount_amount decimal(10,2) default 0 check (discount_amount >= 0),
    total_amount decimal(10,2) not null check (total_amount >= 0),
    currency text default 'NGN',
    coins_used integer default 0 check (coins_used >= 0),
    shipping_address jsonb not null,
    billing_address jsonb,
    notes text,
    tracking_number text,
    shipped_at timestamp with time zone,
    delivered_at timestamp with time zone,
    canceled_at timestamp with time zone,
    cancellation_reason text,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Order items
CREATE TABLE IF NOT EXISTS public.order_items (
    id bigint primary key generated always as identity,
    order_id bigint not null references public.orders(id) on delete cascade,
    product_id bigint not null references public.products(id),
    variant_id bigint references public.product_variants(id),
    quantity integer not null check (quantity > 0),
    unit_price decimal(10,2) not null check (unit_price >= 0),
    total_price decimal(10,2) not null check (total_price >= 0),
    product_snapshot jsonb not null,
    created_at timestamp with time zone default now()
);
