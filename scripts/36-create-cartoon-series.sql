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
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(255)        not null,
  description     TEXT,
  thumbnail_url   TEXT,
  episode_count   INTEGER DEFAULT 0,
  status          VARCHAR(50) DEFAULT 'active', -- e.g. active | completed
  release_date    date,
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
      and policyname = 'Allow public read access to cartoon_series'
  ) then
    create policy "Allow public read access to cartoon_series"
      on public.cartoon_series
      for select
      using (true);
  end if;
end$$;

-- ─────────────────────────── CARTOON_EPISODES ──────────────────────────────
create table if not exists public.cartoon_episodes (
  id             SERIAL PRIMARY KEY,
  series_id      INTEGER        not null
    references public.cartoon_series(id) on delete cascade,
  title          VARCHAR(255)   not null,
  description    TEXT,
  episode_number INTEGER        not null,
  video_url      TEXT,
  thumbnail_url  TEXT,
  duration       INTEGER,                    -- seconds
  is_published   BOOLEAN DEFAULT false,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  UNIQUE(series_id, episode_number)
);

create index if not exists idx_cartoon_episodes_series_id
  on public.cartoon_episodes (series_id);

create index if not exists idx_cartoon_episodes_published
  on public.cartoon_episodes (is_published);

alter table public.cartoon_episodes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'cartoon_episodes'
      and policyname = 'Allow public read access to cartoon_episodes'
  ) then
    create policy "Allow public read access to cartoon_episodes"
      on public.cartoon_episodes
      for select
      using (is_published = true);
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

-- Insert sample data if tables are empty
INSERT INTO public.cartoon_series (title, description, thumbnail_url, episode_count, status)
SELECT 
    'Erigga Chronicles',
    'Follow the adventures and stories from the streets of Warri',
    '/placeholder.svg',
    3,
    'active'
WHERE NOT EXISTS (SELECT 1 FROM public.cartoon_series);

-- Insert sample episodes
INSERT INTO public.cartoon_episodes (series_id, title, description, episode_number, video_url, thumbnail_url, duration, is_published)
SELECT 
    1,
    'Episode 1: The Beginning',
    'The origin story of how it all started',
    1,
    '/placeholder-video.mp4',
    '/placeholder.svg',
    1800,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.cartoon_episodes WHERE series_id = 1 AND episode_number = 1);

INSERT INTO public.cartoon_episodes (series_id, title, description, episode_number, video_url, thumbnail_url, duration, is_published)
SELECT 
    1,
    'Episode 2: Street Wisdom',
    'Lessons learned from the streets',
    2,
    '/placeholder-video.mp4',
    '/placeholder.svg',
    2100,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.cartoon_episodes WHERE series_id = 1 AND episode_number = 2);

INSERT INTO public.cartoon_episodes (series_id, title, description, episode_number, video_url, thumbnail_url, duration, is_published)
SELECT 
    1,
    'Episode 3: Rise to Fame',
    'The journey to becoming a rap legend',
    3,
    '/placeholder-video.mp4',
    '/placeholder.svg',
    1950,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.cartoon_episodes WHERE series_id = 1 AND episode_number = 3);
