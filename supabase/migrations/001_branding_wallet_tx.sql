-- Branding table for theme management
create table if not exists public.branding (
  id int primary key default 1,
  dark_logo_url text,
  dark_bg_hex text check (dark_bg_hex ~* '^#([0-9a-f]{6}|[0-9a-f]{3})$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Wallet table for user balances
create table if not exists public.wallet (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Transactions table for payment tracking
create table if not exists public.transactions (
  id bigserial primary key,
  reference text unique not null,
  amount bigint not null,
  status text not null,
  raw jsonb not null,
  created_at timestamptz not null default now()
);

-- Helper RPC for atomic balance increments
create or replace function public.increment_wallet_balance(p_user_id uuid, p_delta bigint)
returns void language plpgsql as $$
begin
  insert into public.wallet (user_id, balance) 
  values (p_user_id, p_delta)
  on conflict (user_id) 
  do update set 
    balance = public.wallet.balance + excluded.balance,
    updated_at = now();
end;
$$;

-- Add role column to profiles if missing
alter table public.profiles add column if not exists role text default 'user';

-- Enable RLS
alter table public.branding enable row level security;
alter table public.wallet enable row level security;
alter table public.transactions enable row level security;

-- RLS policies for branding
create policy "branding read for all" on public.branding for select using (true);
create policy "branding write for admins" on public.branding for insert 
  with check (exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() and p.role = 'admin'
  ));
create policy "branding update for admins" on public.branding for update 
  using (exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() and p.role = 'admin'
  ));

-- RLS policies for wallet
create policy "wallet owner read" on public.wallet for select 
  using (auth.uid() = user_id);
create policy "wallet owner update via rpc" on public.wallet for update 
  using (false); -- updates via RPC only

-- RLS policies for transactions
create policy "transactions admin read" on public.transactions for select 
  using (exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() and p.role = 'admin'
  ));

-- Create indexes for performance
create index if not exists idx_wallet_user_id on public.wallet(user_id);
create index if not exists idx_transactions_reference on public.transactions(reference);
create index if not exists idx_profiles_role on public.profiles(role);

-- Update timestamps trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_branding_updated_at before update on public.branding
  for each row execute function update_updated_at_column();

create trigger update_wallet_updated_at before update on public.wallet
  for each row execute function update_updated_at_column();
