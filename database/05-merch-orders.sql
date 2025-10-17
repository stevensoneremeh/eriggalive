-- Merch orders table for preorder tracking
CREATE TABLE IF NOT EXISTS public.merch_orders (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    reference text unique not null,
    status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'canceled')),
    amount decimal(10,2) not null check (amount >= 0),
    currency text default 'NGN',
    payment_reference text,
    item_id text not null,
    item_name text not null,
    item_details jsonb default '{}',
    delivery_address jsonb,
    payment_verified_at timestamp with time zone,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Add RLS policies
ALTER TABLE public.merch_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own merch orders" ON public.merch_orders
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own merch orders" ON public.merch_orders
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_merch_orders_user_id ON public.merch_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_merch_orders_reference ON public.merch_orders(reference);
CREATE INDEX IF NOT EXISTS idx_merch_orders_status ON public.merch_orders(status);
