-- ============================================================================
-- Crypto Sentinel AI — Supabase schema
--
-- Run this once in your Supabase project:  SQL Editor → paste → Run.
-- It creates the user-owned tables and locks them down with Row-Level
-- Security so each user can only ever read/write their own rows.
--
-- Auth itself is handled by Supabase Auth (auth.users) — this file only adds
-- the application data that hangs off a user.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles: 1:1 with auth.users, auto-created on signup
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  name       text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- watchlist
-- ---------------------------------------------------------------------------
create table if not exists public.watchlist (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  symbol     text not null,
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);
create index if not exists watchlist_user_idx on public.watchlist (user_id);

-- ---------------------------------------------------------------------------
-- trading_rules
-- ---------------------------------------------------------------------------
create table if not exists public.trading_rules (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  name           text not null,
  enabled        boolean not null default true,
  mode           text not null default 'paper',   -- paper | manual-approval | automatic
  side           text not null default 'buy',      -- buy | sell
  conditions     jsonb not null default '[]'::jsonb,
  risk           jsonb not null default '{}'::jsonb,
  exchange       text not null default 'Binance',
  trigger_count  int  not null default 0,
  last_triggered timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists trading_rules_user_idx on public.trading_rules (user_id);

-- ---------------------------------------------------------------------------
-- trades (executed / rejected / missed — paper by default)
-- ---------------------------------------------------------------------------
create table if not exists public.trades (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  symbol     text not null,
  side       text not null,               -- buy | sell
  status     text not null,               -- executed | rejected | missed
  qty        numeric not null default 0,
  price      numeric not null default 0,
  pnl        numeric,
  rule_name  text,
  reason     text,
  paper      boolean not null default true,
  ts         timestamptz not null default now()
);
create index if not exists trades_user_ts_idx on public.trades (user_id, ts desc);

-- ---------------------------------------------------------------------------
-- notification_settings (1 row per user)
-- ---------------------------------------------------------------------------
create table if not exists public.notification_settings (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  channels   jsonb not null default '{"browser":true,"email":true,"discord":false,"telegram":false,"slack":false,"webhook":false}'::jsonb,
  min_level  text not null default 'yellow',  -- green | yellow | red
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- exchange_keys — API keys are ENCRYPTED app-side before insert (never plaintext)
-- ---------------------------------------------------------------------------
create table if not exists public.exchange_keys (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  exchange          text not null,
  api_key_cipher    text not null,
  api_secret_cipher text not null,
  permissions       text[] not null default '{}',
  created_at        timestamptz not null default now(),
  unique (user_id, exchange)
);
create index if not exists exchange_keys_user_idx on public.exchange_keys (user_id);

-- ---------------------------------------------------------------------------
-- Row-Level Security: each user sees only their own rows.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'watchlist','trading_rules','trades','notification_settings','exchange_keys'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "own rows: select" on public.%I;', t);
    execute format('create policy "own rows: select" on public.%I for select using (auth.uid() = user_id);', t);
    execute format('drop policy if exists "own rows: insert" on public.%I;', t);
    execute format('create policy "own rows: insert" on public.%I for insert with check (auth.uid() = user_id);', t);
    execute format('drop policy if exists "own rows: update" on public.%I;', t);
    execute format('create policy "own rows: update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
    execute format('drop policy if exists "own rows: delete" on public.%I;', t);
    execute format('create policy "own rows: delete" on public.%I for delete using (auth.uid() = user_id);', t);
  end loop;
end $$;
