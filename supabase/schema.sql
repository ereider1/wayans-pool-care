-- Wayan's Pool Care schema
-- Run in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.pools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_name text,
  address text,
  volume numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid references public.pools(id) on delete set null,
  visited_at timestamptz not null default now(),
  ph numeric(4,2) not null check (ph >= 0 and ph <= 14),
  chlorine numeric(6,2) not null check (chlorine >= 0),
  notes text,
  status text not null default 'normal'
    check (status in ('normal','check','needs_attention')),
  created_at timestamptz not null default now()
);

create table if not exists public.visit_chemicals (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  chemical text not null,
  amount numeric(10,2) not null check (amount >= 0),
  unit text not null default 'kg'
    check (unit in ('kg','oz','gal','lbs','other'))
);

create table if not exists public.visit_photos (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  photo_type text not null
    check (photo_type in ('test_strip','pool','filter','equipment','other')),
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists visits_visited_at_idx
  on public.visits (visited_at desc);

create index if not exists visit_chemicals_visit_id_idx
  on public.visit_chemicals (visit_id);

create index if not exists visit_photos_visit_id_idx
  on public.visit_photos (visit_id);

alter table public.pools enable row level security;
alter table public.visits enable row level security;
alter table public.visit_chemicals enable row level security;
alter table public.visit_photos enable row level security;

-- Private storage bucket. The browser only receives the publishable key.
insert into storage.buckets (id, name, public)
values ('pool-photos', 'pool-photos', false)
on conflict (id) do update set public = false;

-- Because Wayan is the sole user, we grant all access to authenticated users.
-- Signups should be disabled in the Supabase dashboard.

create policy "Auth user can do all on pools" on public.pools for all to authenticated using (true) with check (true);
create policy "Auth user can do all on visits" on public.visits for all to authenticated using (true) with check (true);
create policy "Auth user can do all on visit_chemicals" on public.visit_chemicals for all to authenticated using (true) with check (true);
create policy "Auth user can do all on visit_photos" on public.visit_photos for all to authenticated using (true) with check (true);

-- Storage policies for the authenticated user
create policy "Auth user can manage pool photos" on storage.objects for all to authenticated
  using (bucket_id = 'pool-photos')
  with check (bucket_id = 'pool-photos');
