-- Real accounts: tighten the anonymous-friendly policies from 0001_init.sql
-- now that Supabase Auth is wired up client-side, and add a `follows` table
-- so signed-in users can watch a cat and get in-app match notifications.
--
-- Reporting (insert) now requires a signed-in user, and the row must be
-- attributed to that user (can't insert a cat/sighting owned by someone
-- else). Updates stay open to any signed-in user rather than owner-only:
-- the dedup flow lets any reporter link a new sighting or flag medical
-- needs on a cat someone else created, and that's intentional community
-- behavior, not a bug. /demo never touches these tables at all, so this
-- migration has no effect on the demo walkthrough.

drop policy if exists "anyone can insert cats" on public.cats;
create policy "signed-in users can insert their own cats"
  on public.cats for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "anyone can update cats" on public.cats;
create policy "signed-in users can update cats"
  on public.cats for update
  to authenticated
  using (true);

drop policy if exists "anyone can insert sightings" on public.sightings;
create policy "signed-in users can insert their own sightings"
  on public.sightings for insert
  to authenticated
  with check (auth.uid() = reporter_id);

create table if not exists public.follows (
  user_id uuid not null references auth.users (id) on delete cascade,
  cat_id uuid not null references public.cats (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, cat_id)
);

alter table public.follows enable row level security;

drop policy if exists "users can read their own follows" on public.follows;
create policy "users can read their own follows"
  on public.follows for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users can add their own follows" on public.follows;
create policy "users can add their own follows"
  on public.follows for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users can remove their own follows" on public.follows;
create policy "users can remove their own follows"
  on public.follows for delete
  to authenticated
  using (auth.uid() = user_id);
