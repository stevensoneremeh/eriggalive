-- ---------------------------------------------------------------------------
-- 36-create-cartoon-series.sql
-- Adds the missing `cartoon_series` & `cartoon_episodes` tables required by
-- /chronicles and any related components.  Idempotent by using IF NOT EXISTS.
-- ---------------------------------------------------------------------------

-- ─────────────────────────── EXTENSIONS ────────────────────────────────────
-- (Only create if they’re not already present.)
create extension if not exists "pgcrypto";

-- ─────────────────────────── CARTOON_SERIES ────────────────────────────────
create table if not exists public.cartoon_series (
  id              uuid primary key default gen_random_uuid(),
  title           text        not null,
  description     text,
  thumbnail_url   text,
  status          text        default 'ongoing', -- e.g. ongoing | completed
  release_date    date,
  total_episodes  int         default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists cartoon_series_created_at_idx
  on public.cartoon_series (created_at desc);

-- Enable Row-Level Security so we can add policies.
alter table public.cartoon_series enable row level security;

-- Allow *anyone* (authenticated or not) to read chronicles.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'cartoon_series'
      and policyname = 'Allow read to all'
  ) then
    create policy "Allow read to all"
      on public.cartoon_series
      for select
      using (true);
  end if;
end$$;

-- ─────────────────────────── CARTOON_EPISODES ──────────────────────────────
create table if not exists public.cartoon_episodes (
  id             uuid primary key default gen_random_uuid(),
  series_id      uuid        not null
    references public.cartoon_series(id) on delete cascade,
  title          text        not null,
  description    text,
  video_url      text,
  duration       int,                    -- seconds
  episode_number int,
  release_date   date,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index if not exists cartoon_episodes_series_idx
  on public.cartoon_episodes (series_id);

alter table public.cartoon_episodes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'cartoon_episodes'
      and policyname = 'Allow read to all'
  ) then
    create policy "Allow read to all"
      on public.cartoon_episodes
      for select
      using (true);
  end if;
end$$;

-- ─────────────────────────── TRIGGERS (optional) ───────────────────────────
-- Keeps updated_at in sync.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

create trigger cartoon_series_updated_at
  before update on public.cartoon_series
  for each row execute procedure public.touch_updated_at();

create trigger cartoon_episodes_updated_at
  before update on public.cartoon_episodes
  for each row execute procedure public.touch_updated_at();
