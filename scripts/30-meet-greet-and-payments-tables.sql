-- Create meet_greet_bookings table
CREATE TABLE IF NOT EXISTS public.meet_greet_bookings (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    booking_date date not null,
    booking_time time not null,
    amount integer not null check (amount > 0),
    payment_reference text unique not null,
    payment_status text not null default 'pending' check (payment_status in ('pending', 'completed', 'failed', 'refunded')),
    status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
    notes text,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create payments table for all payment records
CREATE TABLE IF NOT EXISTS public.payments (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    amount integer not null check (amount > 0),
    currency text not null default 'NGN',
    payment_method text not null default 'paystack',
    reference text unique not null,
    status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
    service_type text not null check (service_type in ('meet_greet', 'coins', 'merchandise', 'premium', 'other')),
    description text,
    metadata jsonb default '{}',
    processed_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create community_chat table for live chat
CREATE TABLE IF NOT EXISTS public.community_chat (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    content text not null,
    is_deleted boolean default false,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meet_greet_bookings_user_id ON public.meet_greet_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_meet_greet_bookings_date ON public.meet_greet_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_meet_greet_bookings_status ON public.meet_greet_bookings(status);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_service_type ON public.payments(service_type);

CREATE INDEX IF NOT EXISTS idx_community_chat_user_id ON public.community_chat(user_id);
CREATE INDEX IF NOT EXISTS idx_community_chat_created_at ON public.community_chat(created_at);

-- Enable RLS
ALTER TABLE public.meet_greet_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_chat ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meet_greet_bookings
CREATE POLICY "Users can view their own bookings" ON public.meet_greet_bookings
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can create their own bookings" ON public.meet_greet_bookings
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own bookings" ON public.meet_greet_bookings
    FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can create their own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- RLS Policies for community_chat
CREATE POLICY "Users can view all chat messages" ON public.community_chat
    FOR SELECT USING (NOT is_deleted);

CREATE POLICY "Users can create chat messages" ON public.community_chat
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own chat messages" ON public.community_chat
    FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Add updated_at trigger for meet_greet_bookings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meet_greet_bookings_updated_at BEFORE UPDATE ON public.meet_greet_bookings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_community_chat_updated_at BEFORE UPDATE ON public.community_chat FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
