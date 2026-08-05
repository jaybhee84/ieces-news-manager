-- ============================================================
-- IECES News Manager — Supabase Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Create the news_articles table
create table if not exists public.news_articles (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  category     text not null,
  tag          text not null,
  date_label   text not null,
  description  text not null,
  icon         text not null default '📰',
  bg_color     text not null default 'bg-amber-100 text-amber-900',
  border_color text not null default 'border-amber-200',
  photos       text[] default '{}',   -- array of Supabase Storage public URLs
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 2. Enable Row Level Security
alter table public.news_articles enable row level security;

-- 3. Allow public read (so the website can fetch articles)
create policy "Public read"
  on public.news_articles for select
  using (true);

-- 4. Allow authenticated users to insert/update/delete
--    (the desktop app logs in with email+password)
create policy "Authenticated insert"
  on public.news_articles for insert
  to authenticated
  with check (true);

create policy "Authenticated update"
  on public.news_articles for update
  to authenticated
  using (true);

create policy "Authenticated delete"
  on public.news_articles for delete
  to authenticated
  using (true);

-- 5. Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger news_articles_updated_at
  before update on public.news_articles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- Storage: in Supabase Dashboard → Storage, create a bucket
-- named  "news-photos"  and set it to PUBLIC.
-- Then add this policy so authenticated users can upload/delete:
-- ============================================================
-- (Run separately in the SQL editor)

insert into storage.buckets (id, name, public)
values ('news-photos', 'news-photos', true)
on conflict (id) do nothing;

create policy "Public view news photos"
  on storage.objects for select
  using (bucket_id = 'news-photos');

create policy "Auth upload news photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'news-photos');

create policy "Auth delete news photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'news-photos');
