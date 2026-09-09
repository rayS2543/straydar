-- Straydar core schema: cats + sightings.
--
-- Auth is intentionally NOT enforced yet (owner_id/reporter_id are nullable,
-- and RLS policies below are permissive `using (true)`). When real auth
-- ships, tighten the update/insert policies to check
-- `auth.uid() = owner_id` / `auth.uid() = reporter_id` instead of adding
-- new tables or columns.

create table if not exists public.cats (
  id uuid primary key default gen_random_uuid(),
  is_seed boolean not null default false,
  name text not null default 'Unknown Cat',
  status text not null default 'sighted_temporary'
    check (status in ('lost', 'stray_resident', 'sighted_temporary', 'found')),
  description text default '',
  temperament text default 'unknown',
  needs_medical_attention boolean not null default false,
  medical_details text,
  primary_photo_url text,
  owner_name text,
  owner_contact text,
  microchip_number text,
  reward_details text,
  owner_id uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sightings (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid references public.cats (id) on delete cascade,
  reporter_id uuid references auth.users (id),
  latitude double precision not null,
  longitude double precision not null,
  sighting_time timestamptz not null default now(),
  photo_url text,
  last_fed_date timestamptz,
  notes text default '',
  created_at timestamptz not null default now()
);

create index if not exists sightings_cat_id_idx on public.sightings (cat_id);
create index if not exists sightings_sighting_time_idx on public.sightings (sighting_time desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists cats_set_updated_at on public.cats;
create trigger cats_set_updated_at
  before update on public.cats
  for each row
  execute function public.set_updated_at();

alter table public.cats enable row level security;
alter table public.sightings enable row level security;

-- Anonymous-friendly policies for now. When auth ships, replace the
-- insert/update policies with owner-scoped checks, e.g.:
--   with check (auth.uid() = owner_id)
--   using (auth.uid() = owner_id)
drop policy if exists "cats are publicly readable" on public.cats;
create policy "cats are publicly readable"
  on public.cats for select
  using (true);

drop policy if exists "anyone can insert cats" on public.cats;
create policy "anyone can insert cats"
  on public.cats for insert
  with check (true);

drop policy if exists "anyone can update cats" on public.cats;
create policy "anyone can update cats"
  on public.cats for update
  using (true);

drop policy if exists "sightings are publicly readable" on public.sightings;
create policy "sightings are publicly readable"
  on public.sightings for select
  using (true);

drop policy if exists "anyone can insert sightings" on public.sightings;
create policy "anyone can insert sightings"
  on public.sightings for insert
  with check (true);
